import { retrieveDodoReconciliationSnapshot } from '@/lib/payments/dodo-reconciliation';
import { upsertCoursePurchaseFromProvider } from "@/lib/course-purchase-sync";
import { db } from "@/lib/db";
import { safeErrorDiagnostic } from "@/lib/error-diagnostics";
import { listDodoPaymentsForCustomer, type DodoApiPaymentRecord } from "@/lib/payments/providers/dodo";
import {
  asObject,
  extractDodoPricing,
  doesDodoPaymentBelongToUser,
  isDodoPaymentGrantable,
  readCustomString,
  resolveDodoMetadata,
  resolveDodoProviderReferenceId,
  resolveDodoVoucherAccounting,
  type LooseObject,
} from "@/lib/payments/providers/dodo-events";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const RUN_BUDGET_MS = 50_000;
const RECENT_PAYMENTS_MS = 48 * 60 * 60 * 1000;
const RECENT_ACTIVITY_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_USERS_PER_RUN = 500;
const MAX_PENDING_USERS = 4096;

type SweepState = {
  running: boolean;
  lastAttemptedUserId: string | null;
  lastCapacityRetryUserId: string | null;
  passStartedAt: number;
  passSince: number;
  passEligibilityCutoff: number;
  passComplete: boolean;
  pendingSinceByUser: Map<string, number>;
  lastPaymentAttemptByUser: Map<string, string>;
};
const processState = globalThis as typeof globalThis & {
  __jazzPaymentSweepStateV1?: SweepState;
};

function getState(now: number): SweepState {
  return processState.__jazzPaymentSweepStateV1 ??= {
    running: false, lastAttemptedUserId: null, lastCapacityRetryUserId: null,
    passStartedAt: now, passSince: now - RECENT_PAYMENTS_MS,
    passEligibilityCutoff: now - RECENT_ACTIVITY_MS, passComplete: false,
    pendingSinceByUser: new Map(), lastPaymentAttemptByUser: new Map(),
  };
}

function beginNextPass(state: SweepState, now: number) {
  // Cover payments/activity during a multi-day pass, including users already
  // visited near its start. Failed users retain their earlier individual cutoff.
  state.passSince = Math.min(now - RECENT_PAYMENTS_MS, state.passStartedAt - RECENT_PAYMENTS_MS);
  state.passEligibilityCutoff = Math.min(now - RECENT_ACTIVITY_MS, state.passStartedAt - RECENT_ACTIVITY_MS);
  state.passStartedAt = now;
  state.lastAttemptedUserId = null;
  state.passComplete = false;
}

function rotatePayments(payments: DodoApiPaymentRecord[], lastId: string | undefined) {
  const index = lastId ? payments.findIndex(p => (p.payment_id ?? p.id) === lastId) : -1;
  return index < 0 ? payments : [...payments.slice(index + 1), ...payments.slice(0, index + 1)];
}

/** One authenticated daily sweep. State/locking are process-local, not a
 * distributed scheduler or historical recovery ledger. On native Next.js,
 * maxDuration is metadata: cancellation must be enforced inside the handler.
 */
export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected || req.headers.get("authorization") !== `Bearer ${expected}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }
  if (req.signal.aborted) {
    return NextResponse.json({ success: false, complete: false, reason: "aborted" }, { status: 499 });
  }
  const state = getState(Date.now());
  if (state.running) {
    return NextResponse.json({ success: false, complete: false, reason: "busy" }, { status: 409 });
  }
  state.running = true;
  const deadlineAt = Date.now() + RUN_BUDGET_MS;
  const deadline = new AbortController();
  const timeout = setTimeout(() => deadline.abort(), RUN_BUDGET_MS);
  const signal = AbortSignal.any([req.signal, deadline.signal]);
  const checkpoint = () => {
    if (Date.now() >= deadlineAt) deadline.abort();
    signal.throwIfAborted();
  };
  let usersScanned = 0;
  let paymentsScanned = 0;
  let unlocked = 0;
  let failures = 0;
  let reason: 'aborted' | 'deadline' | 'incomplete' | 'continuation_capacity' | null = null;

  try {
    checkpoint();
    if (state.passComplete) beginNextPass(state, Date.now());
    const capacityRecovery = state.pendingSinceByUser.size >= MAX_PENDING_USERS;
    if (!capacityRecovery) state.lastCapacityRetryUserId = null;
    const pendingIds = [...state.pendingSinceByUser.keys()];
    const selectUsers = (afterId: string | null) => db.user.findMany({
      where: {
        email: { not: "" },
        ...(capacityRecovery ? {
          id: { in: pendingIds, ...(afterId ? { gt: afterId } : {}) },
        } : {
          ...(afterId ? { id: { gt: afterId } } : {}),
          OR: [
            { updatedAt: { gte: new Date(state.passEligibilityCutoff) } },
            { createdAt: { gte: new Date(state.passEligibilityCutoff) } },
            ...(pendingIds.length ? [{ id: { in: pendingIds } }] : []),
          ],
        }),
      },
      orderBy: { id: "asc" },
      select: { id: true, email: true },
      take: MAX_USERS_PER_RUN + 1,
    });
    let users = await selectUsers(capacityRecovery ? state.lastCapacityRetryUserId : state.lastAttemptedUserId);
    checkpoint();
    if (capacityRecovery && !users.length && state.lastCapacityRetryUserId) {
      // A saturated queue gets its own rotating retry cursor. Preserve the
      // ordinary tail so failures cannot deadlock it or evict earlier windows.
      users = await selectUsers(null);
      checkpoint();
    }

    for (const user of users.slice(0, MAX_USERS_PER_RUN)) {
      checkpoint();
      if (!state.pendingSinceByUser.has(user.id) && state.pendingSinceByUser.size >= MAX_PENDING_USERS) {
        reason = 'continuation_capacity';
        break;
      }
      const since = Math.min(state.passSince, state.pendingSinceByUser.get(user.id) ?? state.passSince);
      // Reserve the retry window before work begins. Advance the active cursor
      // after an attempt even on failure, so one customer cannot starve its tail.
      state.pendingSinceByUser.set(user.id, since);
      let userFailed = false;
      try {
        const email = user.email?.trim().toLowerCase();
        if (!email) throw new Error('Sweep user has no usable email');
        checkpoint();
        const payments = await listDodoPaymentsForCustomer({
          email, sinceISO: new Date(since).toISOString(), pageSize: 50, signal,
        });
        paymentsScanned += payments.length;
        checkpoint();
        for (const payment of rotatePayments(payments, state.lastPaymentAttemptByUser.get(user.id))) {
          checkpoint();
          try {
            const paymentPayload = {
              type: `payment.${String(payment.status ?? "unknown").toLowerCase()}`,
              id: payment.id,
              data: {
                payment, customer: asObject(payment.customer),
                customer_email: payment.customer_email,
                amount: payment.amount, subtotal_amount: payment.subtotal_amount,
                total_amount: payment.total_amount, metadata: asObject(payment.metadata),
              },
              metadata: asObject(payment.metadata),
            } as LooseObject;
            if (!isDodoPaymentGrantable(asObject(payment)) ||
                !doesDodoPaymentBelongToUser(paymentPayload, user.id, email)) continue;
            const courseId = readCustomString(resolveDodoMetadata(paymentPayload), "courseId", "course_id");
            if (!courseId) continue;
            checkpoint();
            const existing = await db.purchase.findUnique({
              where: { userId_courseId: { userId: user.id, courseId } }, select: { id: true },
            });
            checkpoint();
            if (existing) continue;
            const providerReferenceId = resolveDodoProviderReferenceId(paymentPayload) ??
              (payment.id ? `dodo-pay:${payment.id}` : null);
            if (!providerReferenceId) continue;
            const snapshot = await retrieveDodoReconciliationSnapshot(payment, { signal });
            checkpoint();
            if (!snapshot || !doesDodoPaymentBelongToUser(snapshot, user.id, email) ||
                readCustomString(resolveDodoMetadata(snapshot), "courseId", "course_id") !== courseId) continue;
            const { subtotalAmount, totalAmount, discountAmount, paymentCurrency, paymentAmountMinor } = extractDodoPricing(snapshot);
            checkpoint();
            // Prisma cannot cancel an in-flight transaction. Await settlement
            // while retaining single-flight, count its commit, then stop new work.
            await upsertCoursePurchaseFromProvider({
              userId: user.id, courseId, providerReferenceId,
              originalPrice: subtotalAmount, finalPrice: totalAmount, discountAmount,
              paymentCurrency,
              paymentAmountMinor,
              ...resolveDodoVoucherAccounting(snapshot),
            });
            unlocked += 1;
            checkpoint();
          } catch (error) {
            if (signal.aborted || Date.now() >= deadlineAt) throw error;
            if (error instanceof Error && error.name === "DodoPaymentRevokedError") continue;
            userFailed = true;
            console.error("[CRON_PAYMENTS_SWEEP_PAYMENT_ERROR]", safeErrorDiagnostic(error));
          } finally {
            // Only an ID is retained; every retry re-lists and verifies fresh
            // provider detail, ownership and reversal/accounting state.
            const id = payment.payment_id ?? payment.id;
            if (typeof id === 'string' && id.length <= 256) state.lastPaymentAttemptByUser.set(user.id, id);
          }
        }
        if (!userFailed) {
          state.pendingSinceByUser.delete(user.id);
          state.lastPaymentAttemptByUser.delete(user.id);
        }
      } catch (error) {
        if (signal.aborted || Date.now() >= deadlineAt) {
          reason = req.signal.aborted ? 'aborted' : 'deadline';
        } else {
          userFailed = true;
          console.error("[CRON_PAYMENTS_SWEEP_USER_ERROR]", safeErrorDiagnostic(error));
        }
      } finally {
        usersScanned += 1;
        if (capacityRecovery) state.lastCapacityRetryUserId = user.id;
        else state.lastAttemptedUserId = user.id;
        if (userFailed) failures += 1;
      }
      if (reason) break;
    }
    // A filled batch is not proof the tail was scanned. No raw cursor or user
    // identity is returned; a caller may consume hasMore with a bounded loop.
    if (capacityRecovery) {
      if (!reason && state.pendingSinceByUser.size >= MAX_PENDING_USERS) reason = 'continuation_capacity';
    } else if (!reason && usersScanned === users.length) state.passComplete = true;
  } catch (error) {
    if (signal.aborted || Date.now() >= deadlineAt) reason = req.signal.aborted ? 'aborted' : 'deadline';
    else {
      failures += 1;
      reason = 'incomplete';
      console.error("[CRON_PAYMENTS_SWEEP_ERROR]", safeErrorDiagnostic(error));
    }
  } finally {
    clearTimeout(timeout);
    // Never release early via Promise.race: all initiated work has settled.
    state.running = false;
  }

  const complete = !reason && state.passComplete && state.pendingSinceByUser.size === 0 && failures === 0;
  return NextResponse.json({
    success: complete, complete, passComplete: state.passComplete,
    hasMore: !state.passComplete, reason: complete ? null : reason ?? 'incomplete',
    usersScanned, paymentsScanned, unlocked, failures,
    pendingUsers: state.pendingSinceByUser.size,
    coverage: 'recent_eligible_users', state: 'process_local',
  }, { status: complete ? 200 : reason === 'aborted' ? 499 : 503 });
}

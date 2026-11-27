import { describe, expect, test } from "vitest";

import {
  evaluateIngressRequest,
  isRecoveryRequestAllowed,
} from "../../scripts/native/ingress-policy.mjs";

const lesson = "a1111111-b111-4111-8111-111111111111";
const attachment = "22222222-2222-4222-8222-222222222222";
const video = `/api/lessons/${lesson}/mux-playback`;
const pdf = `/api/lessons/${lesson}/attachments/${attachment}`;
const pdfQuery = "language=es&download=0&proxy=1";

function allows(target: string, method = "GET", headers = {}) {
  return isRecoveryRequestAllowed({ method, target, headers });
}

describe("bounded recovered-media request dispatch", () => {
  test("admits the signed-playback GET without extra query controls", () => {
    expect(allows(video)).toBe(true);
  });

  test.each(["es", "en", "fr", "pt"])(
    "admits only the inline PDF proxy contract in %s", (language) => {
      expect(allows(`${pdf}?language=${language}&download=0&proxy=1`)).toBe(true);
      expect(allows(`${pdf}?proxy=1&download=0&language=${language}`)).toBe(true);
    },
  );

  test.each(["HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "does not widen media dispatch to %s", (method) => {
      expect(allows(video, method)).toBe(false);
      expect(allows(`${pdf}?${pdfQuery}`, method)).toBe(false);
    },
  );

  test.each([
    "", "?", "?language=es", "?language=es&proxy=1",
    "?language=es&download=1&proxy=1", "?language=es&download=0&proxy=0",
    "?language=de&download=0&proxy=1", "?language=ES&download=0&proxy=1",
    `?${pdfQuery}&redirect=https%3A%2F%2Fexample.invalid`,
    `?${pdfQuery}&proxy=1`, `?${pdfQuery}&language=pt`,
  ])("denies an unreviewed or ambiguous PDF query %s", (query) => {
    expect(allows(`${pdf}${query}`)).toBe(false);
  });

  test.each(["?", "?language=es", "?proxy=1", "?__nextDefaultLocale=es"])(
    "denies extra playback query controls %s", (query) => {
      expect(allows(`${video}${query}`)).toBe(false);
    },
  );

  test.each([
    video.replace(lesson, "not-an-id"), video.replace(lesson, lesson.toUpperCase()),
    `${video}/`, video.replace("mux-playback", "progress"),
    video.replace("/api/", "/%61pi/"), video.replace("/lessons/", "/lessons//"),
    video.replace(lesson, `${lesson}%2f..`), `${pdf}/download?${pdfQuery}`,
    `${pdf.replace(attachment, "other")}?${pdfQuery}`,
  ])("does not admit another route or encoded alias %s", (target) => {
    expect(allows(target)).toBe(false);
  });

  test.each(["next-action", "x-matched-path", "x-now-route-matches", "x-middleware-rewrite", "x-invoke-path", "x-nextjs-data"])(
    "retains the route-override denial for %s", (header) => {
      expect(allows(video, "GET", { [header]: "1" })).toBe(false);
      expect(allows(`${pdf}?${pdfQuery}`, "GET", { [header]: "1" })).toBe(false);
    },
  );

  test("requires the ordinary recovery edge checks before dispatch", () => {
    const request = {
      method: "GET", target: video,
      headers: { host: "review.trycloudflare.com", "x-forwarded-proto": "https", "cf-connecting-ip": "203.0.113.42" },
    };
    const policy = { canonicalHost: "review.trycloudflare.com", recoveryAccess: true };
    expect(evaluateIngressRequest(request, policy).action).toBe("proxy");
    expect(evaluateIngressRequest({ ...request, headers: { ...request.headers, "x-forwarded-proto": "http" } }, policy).action).toBe("deny");
    expect(evaluateIngressRequest({ ...request, method: "POST" }, policy).action).toBe("deny");
  });

  test("keeps checkout, reconciliation, progress and admin writes unavailable", () => {
    for (const target of ["/api/checkout", "/api/vouchers/redeem", "/api/purchases", `/api/lessons/${lesson}/progress`, "/admin/users"]) {
      for (const method of ["GET", "POST", "PUT", "PATCH", "DELETE"]) {
        expect(allows(target, method)).toBe(false);
      }
    }
    expect(allows("/api/auth/session", "POST")).toBe(true);
    expect(allows("/dashboard", "HEAD")).toBe(true);
  });
});

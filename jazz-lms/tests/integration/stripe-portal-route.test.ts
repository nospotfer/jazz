import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

/**
 * Stripe portal route tests.
 * Uses vi.doMock + vi.resetModules for clean stripe module state per test.
 */

describe('POST /api/stripe-portal', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeReq() {
    return new Request('http://localhost/api/stripe-portal', {
      method: 'POST',
      headers: { origin: 'http://localhost:3000' },
    });
  }

  test('returns 503 when stripe is not configured', async () => {
    vi.doMock('@/lib/stripe', () => ({ stripe: null }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser: vi.fn() } }),
    }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn() } } }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(503);
  });

  test('returns 401 when unauthenticated', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: null } });
    vi.doMock('@/lib/stripe', () => ({
      stripe: { customers: { list: vi.fn() }, billingPortal: { sessions: { create: vi.fn() } } },
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn() } } }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(401);
  });

  test('returns 400 when user has no email', async () => {
    const getUser = vi.fn().mockResolvedValue({ data: { user: { id: 'u1', email: null } } });
    vi.doMock('@/lib/stripe', () => ({
      stripe: { customers: { list: vi.fn() }, billingPortal: { sessions: { create: vi.fn() } } },
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn() } } }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(400);
  });

  test('creates portal session with existing stripe customer', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: 'user@example.com' } },
    });
    const customersList = vi.fn().mockResolvedValue({ data: [{ id: 'cus_existing' }] });
    const portalCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/session/123' });

    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        customers: { list: customersList, create: vi.fn() },
        billingPortal: { sessions: { create: portalCreate } },
      },
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue({ name: 'Test User' }) } },
    }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.url).toBe('https://billing.stripe.com/session/123');
  });

  test('creates new stripe customer when none exists', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'u1', email: 'new@example.com' } },
    });
    const customersList = vi.fn().mockResolvedValue({ data: [] });
    const customerCreate = vi.fn().mockResolvedValue({ id: 'cus_new' });
    const portalCreate = vi.fn().mockResolvedValue({ url: 'https://billing.stripe.com/new' });

    vi.doMock('@/lib/stripe', () => ({
      stripe: {
        customers: { list: customersList, create: customerCreate },
        billingPortal: { sessions: { create: portalCreate } },
      },
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    vi.doMock('@/lib/db', () => ({
      db: { user: { findUnique: vi.fn().mockResolvedValue({ name: 'New User' }) } },
    }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(customerCreate).toHaveBeenCalledTimes(1);
    expect(body.url).toBe('https://billing.stripe.com/new');
  });

  test('returns 500 on internal error', async () => {
    const getUser = vi.fn().mockRejectedValue(new Error('db down'));
    vi.doMock('@/lib/stripe', () => ({
      stripe: { customers: { list: vi.fn() }, billingPortal: { sessions: { create: vi.fn() } } },
    }));
    vi.doMock('@/utils/supabase/server', () => ({
      createClient: () => ({ auth: { getUser } }),
    }));
    vi.doMock('@/lib/db', () => ({ db: { user: { findUnique: vi.fn() } } }));

    const { POST } = await import('@/app/api/stripe-portal/route');
    const response = await POST(makeReq());
    expect(response.status).toBe(500);
  });
});

import type { IncomingHttpHeaders } from "node:http";
import { describe, expect, test } from "vitest";

import {
  evaluateIngressRequest,
  normalizeClientIp,
} from "../../scripts/native/ingress-policy.mjs";

const canonicalHost = "www.culturadeljazz.com";
const apexHost = "culturadeljazz.com";
const trustedIp = "203.0.113.42";
const policy = { canonicalHost, apexHost };

function evaluate(input: {
  method?: string;
  target?: string;
  headers?: Record<string, string | string[] | undefined>;
} = {}) {
  return evaluateIngressRequest({
    method: input.method ?? "GET",
    target: input.target ?? "/dashboard",
    // Arrays deliberately exercise malformed/ambiguous boundary input even
    // for fields that Node normally combines into a single string.
    headers: {
      host: canonicalHost,
      "x-forwarded-proto": "https",
      "cf-connecting-ip": trustedIp,
      ...input.headers,
    } as IncomingHttpHeaders,
  }, policy);
}

function expectDenied(result: ReturnType<typeof evaluate>) {
  expect(result.action).toBe("deny");
  expect(result.status).toBeGreaterThanOrEqual(400);
  expect(result.status).toBeLessThan(500);
  expect(result.location).toBeUndefined();
}

// Pure helper checks establish policy behavior, not Cloudflare account/tunnel
// configuration, origin reachability, TLS termination or deployed trust.
describe("native ingress host and HTTPS boundary", () => {
  test.each([canonicalHost, "WWW.CULTURADELJAZZ.COM", `${canonicalHost}:443`])(
    "accepts and canonicalizes the exact www Host alias %s", (host) => {
      const result = evaluate({ headers: { host } });
      expect(result).toMatchObject({ action: "proxy", headers: {
        host: canonicalHost, "x-forwarded-host": canonicalHost,
        "x-forwarded-proto": "https",
      } });
    },
  );

  test.each([
    undefined,
    "",
    "evil.example.invalid",
    "www.culturadeljazz.com.evil.example.invalid",
    "evil-www.culturadeljazz.com",
    `${canonicalHost}:80`,
    `${canonicalHost}:444`,
    `${canonicalHost}.`,
    `https://${canonicalHost}`,
    `${canonicalHost},evil.example.invalid`,
    `${canonicalHost}\r\nX-Injected: yes`,
    [canonicalHost],
    [canonicalHost, apexHost],
  ])("denies an absent, ambiguous or foreign Host %j", (host) => {
    expectDenied(evaluate({ headers: { host } }));
  });

  test.each([undefined, "", "http", "HTTPS", "https,http", "https, https", ["https"]])(
    "requires one exact HTTPS forwarded protocol rather than %j", (value) => {
      expectDenied(evaluate({ headers: { "x-forwarded-proto": value } }));
    },
  );

  test.each([canonicalHost, "WWW.CULTURADELJAZZ.COM:443"])(
    "accepts a matching normalized forwarded Host %s", (value) => {
      expect(evaluate({ headers: { "x-forwarded-host": value } }).action).toBe("proxy");
    },
  );

  test.each([apexHost, "evil.example.invalid", "", `${canonicalHost},${apexHost}`, [canonicalHost]])(
    "denies a present forwarded Host inconsistent or ambiguous with Host: %j", (value) => {
      expectDenied(evaluate({ headers: { "x-forwarded-host": value } }));
    },
  );
});

describe("native ingress trusted client address", () => {
  test.each([
    ["203.0.113.42", "203.0.113.42"],
    ["2001:0DB8:0000:0000:0000:0000:0000:0001", "2001:db8::1"],
    ["2001:db8:0:1:0:0:0:1", "2001:db8:0:1::1"],
    ["::1", "::1"],
    ["::ffff:203.0.113.42", trustedIp],
    ["0:0:0:0:0:FFFF:CB00:712A", trustedIp],
  ])("normalizes %s to one canonical identity %s", (value, expected) => {
    expect(normalizeClientIp(value)).toBe(expected);
    expect(evaluate({ headers: { "cf-connecting-ip": value } })).toMatchObject({
      action: "proxy", headers: { "x-forwarded-for": expected, "x-real-ip": expected },
    });
  });

  test.each([
    undefined, null, "", "not-an-ip", "127.1", "0177.0.0.1", "0x7f.0.0.1",
    "2130706433", "203.0.113.256", "203.0.113.01", "203.0.113.42:443",
    "[2001:db8::1]", "fe80::1%eth0", "203.0.113.42, 198.51.100.1",
    "203.0.113.42\r\nX-Injected: yes", [trustedIp], [trustedIp, "198.51.100.1"],
  ])("rejects a non-single or noncanonical address representation %j", (value) => {
    expect(normalizeClientIp(value)).toBeNull();
  });

  test.each([undefined, "", "not-an-ip", `${trustedIp}, 198.51.100.1`, [trustedIp]])(
    "requires one valid trusted CF-Connecting-IP, received %j", (value) => {
      expectDenied(evaluate({ headers: { "cf-connecting-ip": value } }));
    },
  );

  test.each(["cf-worker", "cf-pseudo-ipv4", "cf-connecting-ipv6"])(
    "denies unverified worker/pseudo-address mode when %s is present", (name) => {
      expectDenied(evaluate({ headers: { [name]: "198.51.100.10" } }));
      expectDenied(evaluate({ headers: { [name]: "" } }));
    },
  );

  test("replaces spoofed upstream identity headers with the trusted canonical address", () => {
    const result = evaluate({ headers: {
      "cf-connecting-ip": "::ffff:203.0.113.42",
      "x-forwarded-for": "198.51.100.9, 10.0.0.1",
      "x-real-ip": "198.51.100.10",
      forwarded: "for=198.51.100.11;host=evil.example.invalid;proto=http",
    } });
    expect(result).toMatchObject({ action: "proxy", headers: {
      host: canonicalHost, "x-forwarded-host": canonicalHost,
      "x-forwarded-proto": "https", "x-forwarded-for": trustedIp, "x-real-ip": trustedIp,
    } });
    expect(result.headers?.forwarded).toBeUndefined();
    // Removing CF's input header or replacing it with the canonical identity
    // are both safe; preserving an alternate raw representation is not.
    expect([undefined, trustedIp]).toContain(result.headers?.["cf-connecting-ip"]);
  });
});

describe("native ingress raw request-target validation", () => {
  test.each([
    "https://www.culturadeljazz.com/dashboard",
    "http://evil.example.invalid/dashboard",
    "//www.culturadeljazz.com/dashboard",
    "//evil.example.invalid/dashboard",
    "dashboard", "?course=fixture", "",
    "/dashboard\\settings", "\\dashboard",
    "/dashboard#fragment", "/dashboard\u0000", "/dashboard\n", "/dashboard\r",
    "/dashboard\t", "/./dashboard", "/dashboard/../api/cron", "/dashboard/.",
    "/dashboard/..", "/%2e/dashboard", "/%2E%2E/api/cron",
    "/dashboard/.%2e/api/cron", "/dashboard/%2e./api/cron",
    "/api%2Fcron", "/api%2fcron", "/dashboard%5Csettings", "/dashboard%5csettings",
    "/api/%2563ron", "/api/%252e%252e/dashboard", "/api%252fcron",
    "/dashboard%255csettings", "/dashboard%00", "/dashboard%0a", "/dashboard%0d",
    "/dashboard%", "/dashboard%GG",
  ])("denies an unsafe raw target before URL normalization: %j", (target) => {
    expectDenied(evaluate({ target }));
  });

  test.each(["/", "/dashboard/lesson.foo", "/dashboard?course=fixture&lang=fr",
    "/dashboard/caf%C3%A9.pdf", "/dashboard/course%20notes.pdf"])(
    "preserves an ordinary target %s", (target) => {
      expect(evaluate({ target }).action).toBe("proxy");
    },
  );

  test.each([
    "/api/cron", "/api/cron/", "/api/cron/payments-sweep?cursor=fixture",
    "/%61pi/cron", "/api/%63ron", "/api/cr%6Fn/payments-sweep",
  ])("denies public cron access including encoded aliases: %s", (target) => {
    for (const host of [canonicalHost, apexHost]) {
      for (const method of ["GET", "POST"]) {
        expect(evaluate({ target, method, headers: { host } }))
          .toMatchObject({ action: "deny", status: 403 });
      }
    }
  });
});

describe("native ingress canonical redirect and webhook method boundary", () => {
  test.each(["GET", "HEAD"])("redirects apex %s to the fixed www origin preserving raw target and query", (method) => {
    const target = "/dashboard?course=fixture&next=https%3A%2F%2Fevil.example.invalid";
    const result = evaluate({ method, target, headers: {
      host: "CULTURADELJAZZ.COM:443",
      "x-forwarded-host": apexHost,
      "x-forwarded-for": "198.51.100.99",
    } });
    expect(result).toMatchObject({
      action: "redirect", status: 308, location: `https://${canonicalHost}${target}`,
    });
  });

  test.each(["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "proxies ordinary www %s requests", (method) => {
      expect(evaluate({ method }).action).toBe("proxy");
    },
  );

  test.each(["/api/webhooks/dodo-jazzlms", "/api/webhooks/messages-email"])(
    "directly proxies the exact apex webhook POST %s", (target) => {
      expect(evaluate({ method: "POST", target, headers: { host: apexHost } }))
        .toMatchObject({ action: "proxy", headers: { host: apexHost, "x-forwarded-host": apexHost } });
    },
  );

  test.each([
    [canonicalHost, "/api/webhooks/dodo-jazzlms"],
    [apexHost, "/api/webhooks/dodo-jazzlms"],
    [canonicalHost, "/api/webhooks/messages-email"],
    [apexHost, "/api/webhooks/messages-email"],
  ])("permits Worker transport only for exact provider POST on %s%s, preserving application authentication", (host, target) => {
    const authentication = {
      authorization: "Bearer isolated-provider-token",
      "webhook-id": "msg_isolated_worker",
      "webhook-timestamp": "1890000000",
      "webhook-signature": "v1,isolated+/= v1,second+/=",
      "svix-id": "svix_isolated_worker",
      "svix-timestamp": "1890000000",
      "svix-signature": "v1,isolated+/=",
      "x-inbox-secret": "isolated-provider-secret",
    };
    expect(evaluate({ method: "POST", target, headers: {
      host, "cf-worker": "provider.example.invalid", ...authentication,
    } })).toMatchObject({ action: "proxy", headers: authentication });
  });

  test.each([
    "/api/webhooks/%64odo-jazzlms", "/api/webhooks/dodo-jazzlms/",
    "/api/webhooks/messages-email-other", "/api/purchases",
  ])("does not allow Worker transport on a lookalike or ordinary POST %s", (target) => {
    for (const host of [canonicalHost, apexHost]) {
      expectDenied(evaluate({ method: "POST", target, headers: {
        host, "cf-worker": "provider.example.invalid",
      } }));
    }
  });

  test.each(["GET", "HEAD", "PUT"])("does not allow Worker transport to webhook paths using %s", (method) => {
    for (const host of [canonicalHost, apexHost]) {
      expectDenied(evaluate({ method, target: "/api/webhooks/dodo-jazzlms", headers: {
        host, "cf-worker": "provider.example.invalid",
      } }));
    }
  });

  test.each(["POST", "PUT", "PATCH", "DELETE", "OPTIONS"])(
    "denies other apex mutations with 405: %s", (method) => {
      expect(evaluate({ method, target: "/api/purchases", headers: { host: apexHost } }))
        .toMatchObject({ action: "deny", status: 405 });
    },
  );

  test.each([
    "/api/webhooks/dodo-jazzlms/", "/api/webhooks/dodo-jazzlms/extra",
    "/api/webhooks/dodo-jazzlms-other", "/api/webhooks/messages-email/",
    "/api/webhooks/messages-email-other", "/api/webhooks/%64odo-jazzlms",
    "/api/%77ebhooks/messages-email", "/api/webhooks/DODO-JAZZLMS",
    "/api/webhooks%2Fdodo-jazzlms",
  ])("does not widen the apex POST exception to similar or encoded target %s", (target) => {
    expectDenied(evaluate({ method: "POST", target, headers: { host: apexHost } }));
  });

  test.each(["PUT", "PATCH", "DELETE"])("does not extend the apex webhook exception to %s", (method) => {
    expect(evaluate({ method, target: "/api/webhooks/dodo-jazzlms", headers: { host: apexHost } }))
      .toMatchObject({ action: "deny", status: 405 });
  });
});

describe("native ingress request header forwarding", () => {
  test("preserves authentication, cookies and all supported signature values byte-for-byte", () => {
    const preserved = {
      authorization: "Bearer isolated-token  with-padding",
      cookie: "session=isolated; locale=fr",
      origin: `https://${canonicalHost}`,
      "content-type": "application/json; charset=utf-8",
      "content-length": "41",
      "webhook-id": "msg_isolated",
      "webhook-timestamp": "1890000000",
      "webhook-signature": "v1,a+/= v1,b+/=",
      "svix-id": "svix_isolated",
      "svix-timestamp": "1890000001",
      "svix-signature": "v1,c+/= v1,d+/=",
      "x-inbox-secret": "isolated-inbox-secret",
    };
    expect(evaluate({ method: "POST", target: "/api/webhooks/messages-email", headers: preserved }))
      .toMatchObject({ action: "proxy", headers: preserved });
  });

  test("strips hop-by-hop and ordinary Connection-nominated headers without mutating input", () => {
    const headers = {
      host: canonicalHost,
      "x-forwarded-proto": "https",
      "cf-connecting-ip": trustedIp,
      connection: "keep-alive, X-Internal-Hop",
      "keep-alive": "timeout=5",
      "x-internal-hop": "isolated-hop-value",
      "proxy-authenticate": "Basic isolated-proxy",
      "proxy-authorization": "Basic isolated-proxy-token",
      te: "trailers",
      trailer: "X-Trailer",
      "transfer-encoding": "chunked",
      upgrade: "websocket",
      "x-retained": "isolated-end-to-end",
    };
    const before = { ...headers };
    const result = evaluateIngressRequest({ method: "GET", target: "/dashboard", headers }, policy);
    expect(result.action).toBe("proxy");
    expect(result.headers?.["x-retained"]).toBe("isolated-end-to-end");
    for (const name of ["connection", "keep-alive", "x-internal-hop", "proxy-authenticate",
      "proxy-authorization", "te", "trailer", "transfer-encoding", "upgrade"]) {
      expect(result.headers?.[name]).toBeUndefined();
    }
    expect(headers).toEqual(before);
  });

  test.each([
    "host", "x-forwarded-host", "x-forwarded-proto", "x-forwarded-for", "x-real-ip",
    "forwarded", "cf-connecting-ip", "cf-connecting-ipv6", "cf-pseudo-ipv4",
    "authorization", "cookie", "origin", "content-type", "content-length",
    "webhook-id", "webhook-timestamp", "webhook-signature",
    "svix-id", "svix-timestamp", "svix-signature", "x-inbox-secret",
  ])("rejects Connection nomination of protected %s instead of stripping a security boundary", (name) => {
    expect(evaluate({ headers: { connection: `keep-alive, ${name.toUpperCase()}` } }))
      .toMatchObject({ action: "deny", status: 400 });
  });
});

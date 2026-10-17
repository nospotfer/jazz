import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const ORIGIN = "https://openreplay.example.invalid";
const API_KEY = "synthetic-organization-key";
const PROJECT_ID = 42;
const project = { projectId: PROJECT_ID, projectKey: "synthetic-jazz-key", name: "Synthetic Jazz" };
const unrelated = { projectId: 17, projectKey: "synthetic-other-key", name: "Synthetic other app" };
const NOW = Date.parse("2026-10-13T12:00:00Z");

let fetchMock: ReturnType<typeof vi.fn>;

function response(data: unknown, status = 200) {
  return Response.json({ data }, { status });
}

function users(total = 0) {
  return response({ total, users: [] });
}

async function client() {
  return import("@/lib/analytics/openreplay-api");
}

function calls() {
  return fetchMock.mock.calls.map(([input, options]) => ({
    url: new URL(input instanceof Request ? input.url : String(input)),
    options: options as RequestInit,
  }));
}

beforeEach(() => {
  vi.resetModules();
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(NOW);
  vi.stubEnv("OPENREPLAY_API_KEY", API_KEY);
  vi.stubEnv("OPENREPLAY_PROJECT_ID", String(PROJECT_ID));
  vi.stubEnv("OPENREPLAY_API_URL", ORIGIN);
  fetchMock = vi.fn(async () => { throw new Error("Unexpected isolated OpenReplay request"); });
  // Closed fake fetch: no account/session/API request can leave this test.
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  for (const call of calls()) expect(call.url.origin).toBe(ORIGIN);
  vi.useRealTimers();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("OpenReplay project configuration boundary", () => {
  test.each([
    undefined, "", " ", "0", "0000", "-42", "+42", "NaN", "Infinity",
    "42.0", "4.2", "4e1", "0x2a", "42-other", "42 1", "9007199254740992",
  ])("rejects invalid configured ID %s without fetching anything", async configuredId => {
    vi.stubEnv("OPENREPLAY_PROJECT_ID", configuredId);
    const api = await client();
    expect(api.isOpenReplayApiConfigured()).toBe(false);
    expect(await api.getOpenReplayWidgetData(2)).toMatchObject({
      ok: false, reason: "unconfigured", project: null, windowDays: 2,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each([undefined, "", " "])("missing organization key %s does not fetch", async key => {
    vi.stubEnv("OPENREPLAY_API_KEY", key);
    const api = await client();
    expect(api.isOpenReplayApiConfigured()).toBe(false);
    expect(await api.getOpenReplayWidgetData(1)).toMatchObject({ ok: false, reason: "unconfigured" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test.each(["42", "  0042  ", "9007199254740991"])("accepts valid decimal ID %s and requires its exact numeric match", async value => {
    vi.stubEnv("OPENREPLAY_PROJECT_ID", value);
    const expectedProject = { ...project, projectId: Number(value.trim()) };
    fetchMock.mockResolvedValueOnce(response([expectedProject])).mockResolvedValueOnce(users(5)).mockResolvedValueOnce(users(2));
    const api = await client();
    expect(api.isOpenReplayApiConfigured()).toBe(true);
    expect(await api.getOpenReplayWidgetData(1)).toMatchObject({ ok: true, project: expectedProject, totalUsers: 5 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
});

describe("OpenReplay organization inventory must match the configured project", () => {
  test("does not search another application's users when only its project exists", async () => {
    fetchMock.mockResolvedValueOnce(response([unrelated]));
    const result = await (await client()).getOpenReplayWidgetData(2);
    expect(result).toMatchObject({ ok: false, reason: "fetch_failed", project: null });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(calls()[0].options.method).toBe("GET");
    expect(calls()[0].url.pathname).toBe("/v2/public/projects");
  });

  test("ignores an unmatched first project and searches only the exact later match", async () => {
    fetchMock.mockResolvedValueOnce(response([unrelated, project]))
      .mockResolvedValueOnce(users(3)).mockResolvedValueOnce(users(1));
    const result = await (await client()).getOpenReplayWidgetData(1);
    expect(result).toMatchObject({ ok: true, project, totalUsers: 3 });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    for (const call of calls().slice(1)) {
      expect(call.options.method).toBe("POST");
      expect(call.url.pathname).toBe("/v2/public/synthetic-jazz-key/users");
      expect(call.url.pathname).not.toContain(unrelated.projectKey);
    }
  });

  const malformedInventories: [string, unknown][] = [
    ["null", null], ["object instead of array", { project }], ["string", "not an inventory"],
    ["empty array", []], ["null entry", [null]],
    ["string ID instead of numeric ID", [{ ...project, projectId: "42" }]],
    ["missing project key", [{ projectId: PROJECT_ID, name: "Synthetic Jazz" }]],
    ["empty project key", [{ ...project, projectKey: "" }]],
    ["whitespace project key", [{ ...project, projectKey: " \t " }]],
    ["numeric project key", [{ ...project, projectKey: 123 }]],
    ["null project key", [{ ...project, projectKey: null }]],
  ];

  test.each(malformedInventories)("fails closed on %s without searching users", async (_name, inventory) => {
    fetchMock.mockResolvedValueOnce(response(inventory));
    const result = await (await client()).getOpenReplayWidgetData(1);
    expect(result).toMatchObject({ ok: false, reason: "fetch_failed", project: null });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test("does not replace a malformed exact match with a healthy unrelated project", async () => {
    fetchMock.mockResolvedValueOnce(response([unrelated, { ...project, projectKey: "" }]));
    const result = await (await client()).getOpenReplayWidgetData(1);
    expect(result).toMatchObject({ ok: false, reason: "fetch_failed", project: null });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  test("a project inventory HTTP failure is not a healthy zero", async () => {
    fetchMock.mockResolvedValueOnce(response({ error: "Synthetic permission failure" }, 403));
    expect(await (await client()).getOpenReplayWidgetData(1)).toMatchObject({ ok: false, reason: "fetch_failed", project: null });
    expect(fetchMock).toHaveBeenCalledOnce();
  });
});

describe("OpenReplay users queries and failure reporting", () => {
  test("encodes the exact matched key as one path segment in main and daily queries", async () => {
    const key = "synthetic/key ?#&=next";
    fetchMock.mockResolvedValueOnce(response([{ ...project, projectKey: key }]))
      .mockResolvedValueOnce(users(4)).mockResolvedValueOnce(users(2)).mockResolvedValueOnce(users(3));
    const result = await (await client()).getOpenReplayWidgetData(2);
    expect(result.ok).toBe(true);
    expect(result.project?.projectKey).toBe(key);
    expect(fetchMock).toHaveBeenCalledTimes(4);
    for (const call of calls().slice(1)) {
      expect(call.url.pathname).toBe(`/v2/public/${encodeURIComponent(key)}/users`);
      expect(call.url.search).toBe("");
      expect(call.url.hash).toBe("");
      expect(new Headers(call.options.headers).get("authorization")).toBe(`Bearer ${API_KEY}`);
    }
  });

  test.each(["HTTP", "transport", "malformed JSON"])("main users %s failure reports failure and does not request daily metrics", async failure => {
    fetchMock.mockResolvedValueOnce(response([project]));
    if (failure === "HTTP") fetchMock.mockResolvedValueOnce(response({}, 500));
    else if (failure === "transport") fetchMock.mockRejectedValueOnce(new Error("Synthetic transport failure"));
    else fetchMock.mockResolvedValueOnce(new Response("{invalid JSON", { status: 200 }));
    const result = await (await client()).getOpenReplayWidgetData(2);
    expect(result).toMatchObject({ ok: false, reason: "fetch_failed", project });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  test.each(["HTTP", "transport", "missing data"])("a later daily %s failure cannot masquerade as a complete healthy trend", async failure => {
    fetchMock.mockResolvedValueOnce(response([project])).mockResolvedValueOnce(users(10)).mockResolvedValueOnce(users(7));
    if (failure === "HTTP") fetchMock.mockResolvedValueOnce(response({}, 503));
    else if (failure === "transport") fetchMock.mockRejectedValueOnce(new Error("Synthetic daily transport failure"));
    else fetchMock.mockResolvedValueOnce(Response.json({}));
    const result = await (await client()).getOpenReplayWidgetData(3);
    expect(result).toMatchObject({ ok: false, reason: "fetch_failed", project });
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test("healthy matched main and daily data retain totals, top users, countries and query bounds", async () => {
    const mainUsers = [
      { $user_id: "synthetic-user-a", $email: "a@example.invalid", $country: "ES", $last_seen: NOW - 60000 },
      { $email: "b@example.invalid", $country: "ES" },
      { $country: "FR" },
      { $user_id: "synthetic-user-d", $country: "PT" },
      { $user_id: "synthetic-user-e", $country: "" },
      { $user_id: "synthetic-user-f", $country: "ES" },
    ];
    fetchMock.mockResolvedValueOnce(response([unrelated, project]))
      .mockResolvedValueOnce(response({ total: 99, users: mainUsers }))
      .mockResolvedValueOnce(users(7)).mockResolvedValueOnce(users(0));
    const result = await (await client()).getOpenReplayWidgetData(2);
    expect(result).toMatchObject({ ok: true, project, totalUsers: 99, windowDays: 2 });
    expect(result.reason).toBeUndefined();
    expect(result.topUsers).toHaveLength(5);
    expect(result.topUsers.map(user => user.label)).toEqual([
      "synthetic-user-a", "b@example.invalid", "(anónimo)", "synthetic-user-d", "synthetic-user-e",
    ]);
    expect(result.topUsers[0].sub).toBeTypeOf("string");
    expect(result.topCountries[0]).toEqual({ label: "ES", count: 3 });
    expect(result.topCountries).toEqual(expect.arrayContaining([
      { label: "FR", count: 1 }, { label: "PT", count: 1 }, { label: "—", count: 1 },
    ]));
    expect(result.trend.map(day => day.count)).toEqual([7, 0]);
    expect(new Set(result.trend.map(day => day.label)).size).toBe(2);
    const requests = calls();
    expect(requests).toHaveLength(4);
    expect(JSON.parse(String(requests[1].options.body))).toEqual({
      startTimestamp: NOW - 2 * 86400000, endTimestamp: NOW, limit: 200, page: 1, sortOrder: "desc",
    });
    const daily = requests.slice(2).map(call => JSON.parse(String(call.options.body)));
    for (const day of daily) {
      expect(day).toMatchObject({ limit: 1, page: 1 });
      expect(day.endTimestamp).toBeGreaterThan(day.startTimestamp);
    }
    expect(daily[0].endTimestamp).toBeLessThan(daily[1].startTimestamp);
    for (const query of requests.slice(1)) expect(query.url.pathname).toBe("/v2/public/synthetic-jazz-key/users");
  });
});

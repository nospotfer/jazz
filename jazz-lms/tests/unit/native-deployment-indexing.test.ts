import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

// Exercise the real metadata export without mounting content/provider components.
vi.mock("@/components/landing/board-navigation", () => ({ BoardNavigation: () => null }));
vi.mock("@/components/landing/promo-video", () => ({ PromoVideo: () => null }));
vi.mock("@/components/layout/header", () => ({ Header: () => null }));
vi.mock("next/dynamic", () => ({ default: () => () => null }));

const CANONICAL = "https://www.culturadeljazz.com";
let fetchMock: ReturnType<typeof vi.fn>;

async function metadata(parameters: Record<string, string> = {}) {
  return (await import("@/app/page")).generateMetadata({ searchParams: Promise.resolve(parameters) });
}

async function routes() {
  const robots = (await import("@/app/robots")).default;
  const sitemap = (await import("@/app/sitemap")).default;
  return { robots: robots(), sitemap: sitemap() };
}

beforeEach(() => {
  vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", undefined);
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.stubEnv("APP_URL", CANONICAL);
  vi.stubEnv("NEXT_PUBLIC_APP_URL", CANONICAL);
  fetchMock = vi.fn(async () => { throw new Error("Unexpected indexing provider request"); });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  expect(fetchMock).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("native deployment indexing uses an explicit provider-neutral environment", () => {
  test("native production without Vercel emits actual public metadata, robots and canonical sitemap", async () => {
    vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "production");
    const seo = await import("@/lib/seo");
    expect(process.env.VERCEL_ENV).toBeUndefined();
    expect(seo.isPublicIndexingEnabled()).toBe(true);
    const home = await metadata();
    expect(home.robots).toEqual({ index: true, follow: true });
    expect(home.alternates?.canonical).toBe(`${CANONICAL}/`);
    expect(home.openGraph).toMatchObject({ url: `${CANONICAL}/`, type: "website" });
    const actual = await routes();
    expect(actual.robots).toMatchObject({
      rules: { userAgent: "*", allow: "/", disallow: expect.arrayContaining(["/auth", "/admin", "/dashboard", "/api", "/*?*"]) },
      sitemap: `${CANONICAL}/sitemap.xml`,
    });
    expect(actual.sitemap).toEqual([{ url: `${CANONICAL}/`, changeFrequency: "monthly", priority: 1 }]);
  });

  test("explicit native production takes precedence over a legacy preview marker", async () => {
    vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect((await import("@/lib/seo")).isPublicIndexingEnabled()).toBe(true);
    expect((await metadata()).robots).toEqual({ index: true, follow: true });
  });

  test.each(["preview", "development", "unknown", "", "   ", "Production", "prod"])(
    "explicit deployment flag %j overrides Vercel production and fails closed", async flag => {
      vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", flag);
      vi.stubEnv("VERCEL_ENV", "production");
      expect((await import("@/lib/seo")).isPublicIndexingEnabled()).toBe(false);
      expect((await metadata()).robots).toEqual({ index: false, follow: false });
      expect(await routes()).toEqual({
        robots: { rules: { userAgent: "*", disallow: "/" } }, sitemap: [],
      });
    },
  );

  test("the default helpers read changed process flags instead of caching an earlier production decision", async () => {
    const seo = await import("@/lib/seo");
    vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "production");
    expect(seo.publicHomeMetadata().robots).toEqual({ index: true, follow: true });
    expect(seo.publicSitemap()).toHaveLength(1);
    vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "preview");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(seo.isPublicIndexingEnabled()).toBe(false);
    expect(seo.publicHomeMetadata().robots).toEqual({ index: false, follow: false });
    expect(seo.publicRobots()).toEqual({ rules: { userAgent: "*", disallow: "/" } });
    expect(seo.publicSitemap()).toEqual([]);
  });

  test("native production query URLs remain nonindexable, including OAuth return queries", async () => {
    vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "production");
    const queryCases: Record<string, string>[] = [{ code: "synthetic-oauth-code" }, { lang: "en" }];
    for (const parameters of queryCases) {
      expect((await metadata(parameters)).robots).toEqual({ index: false, follow: false });
    }
    expect((await metadata()).robots).toEqual({ index: true, follow: true });
  });
});

describe("native production preserves origin isolation", () => {
  const deniedOrigins = [
    "invalid-origin", "www.culturadeljazz.com", "http://www.culturadeljazz.com",
    "https://preview.vercel.app", "https://preview.trycloudflare.com",
    "https://www.culturadeljazz.com.attacker.example", "http://127.0.0.1:3012",
    "https://www.culturadeljazz.com:8443", "https://fixture-user:fixture-password@www.culturadeljazz.com",
  ];

  for (const field of ["APP_URL", "NEXT_PUBLIC_APP_URL"] as const) {
    test.each(deniedOrigins)(`${field}=%s denies metadata, robots and sitemap despite production flags`, async origin => {
      vi.stubEnv("APP_DEPLOYMENT_ENVIRONMENT", "production");
      vi.stubEnv("VERCEL_ENV", "production");
      vi.stubEnv(field, origin);
      expect((await import("@/lib/seo")).isPublicIndexingEnabled()).toBe(false);
      expect((await metadata()).robots).toEqual({ index: false, follow: false });
      expect(await routes()).toEqual({
        robots: { rules: { userAgent: "*", disallow: "/" } }, sitemap: [],
      });
    });
  }
});

describe("existing Vercel deployments retain their legacy behavior when the new flag is absent", () => {
  test("legacy Vercel production remains indexable with verified domains", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("APP_URL", "https://culturadeljazz.com");
    expect((await import("@/lib/seo")).isPublicIndexingEnabled()).toBe(true);
    expect((await metadata()).robots).toEqual({ index: true, follow: true });
    expect((await routes()).sitemap.map(entry => entry.url)).toEqual([`${CANONICAL}/`]);
  });

  test.each([undefined, "preview", "development", ""])("legacy marker %s without a new production declaration stays private", async flag => {
    vi.stubEnv("VERCEL_ENV", flag);
    expect((await import("@/lib/seo")).isPublicIndexingEnabled()).toBe(false);
    expect((await metadata()).robots).toEqual({ index: false, follow: false });
    expect((await routes()).sitemap).toEqual([]);
  });

  test("explicit environment objects support native production and preserve the legacy origin checks", async () => {
    const seo = await import("@/lib/seo");
    expect(seo.isPublicIndexingEnabled({
      APP_DEPLOYMENT_ENVIRONMENT: "production", APP_URL: CANONICAL, NEXT_PUBLIC_APP_URL: CANONICAL,
    })).toBe(true);
    expect(seo.isPublicIndexingEnabled({
      APP_DEPLOYMENT_ENVIRONMENT: "preview", VERCEL_ENV: "production", APP_URL: CANONICAL,
    })).toBe(false);
    expect(seo.isPublicIndexingEnabled({ VERCEL_ENV: "production" })).toBe(true);
    expect(seo.isPublicIndexingEnabled({ VERCEL_ENV: "production", APP_URL: "https://preview.vercel.app" })).toBe(false);
  });
});

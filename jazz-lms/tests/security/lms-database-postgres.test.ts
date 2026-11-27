import { PrismaClient } from "@prisma/client";
import { createHmac, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

// Never inherit DATABASE_URL or load .env. Both modes require explicit opt-in
// and are restricted to the two disposable maintenance databases.
const databaseUrl = process.env.LMS_DATABASE_SECURITY_DATABASE_URL;
const localConfigPath = process.env.LMS_DATABASE_SECURITY_CONFIG;
const prefix = `lms-security-${randomUUID()}`;
const browserRoles = ["anon", "authenticated"] as const;
let client: PrismaClient;
let models: string[];
let protectedTables: string[];
let localConfig: Record<string, string> | undefined;
let untouchedObjects: unknown;

function validateDatabaseUrl(value: string) {
  const url = new URL(value);
  const standalone = url.port === "55432" && url.pathname === "/jazz_maintenance";
  const supabase = url.port === "56122" && url.pathname === "/postgres";
  if (!["127.0.0.1", "localhost"].includes(url.hostname) ||
      !["postgres:", "postgresql:"].includes(url.protocol) ||
      (localConfigPath ? !supabase : !standalone)) {
    throw new Error("LMS security tests require the explicitly selected disposable loopback database");
  }
}

const identifier = (value: string) => `"${value.replace(/"/g, '""')}"`;

async function snapshotUntouchedObjects() {
  return client.$queryRawUnsafe(`
    SELECT n.nspname AS schema, c.relname AS name, c.relrowsecurity AS rls,
           c.relforcerowsecurity AS forced, c.relacl::text AS grants
    FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind IN ('r', 'v', 'm') AND
      (n.nspname IN ('auth', 'storage') OR
       (n.nspname = 'public' AND NOT c.relname = ANY($1::text[])))
    ORDER BY n.nspname, c.relname
  `, protectedTables);
}

describe.skipIf(!databaseUrl && !localConfigPath)("LMS database browser isolation on disposable PostgreSQL", () => {
  beforeAll(async () => {
    if (databaseUrl && localConfigPath) throw new Error("Select exactly one local security test configuration");
    let selectedUrl = databaseUrl;
    if (localConfigPath) {
      const entries = (await readFile(localConfigPath, "utf8")).split(/\r?\n/)
        .filter(line => line.includes("=") && !line.startsWith("#"));
      localConfig = Object.fromEntries(entries.map(line => {
        const position = line.indexOf("=");
        return [line.slice(0, position), JSON.parse(line.slice(position + 1))];
      }));
      selectedUrl = localConfig.DB_URL;
      const api = new URL(localConfig.API_URL);
      if (!["127.0.0.1", "localhost"].includes(api.hostname) || api.port !== "56121" || api.protocol !== "http:" ||
          !localConfig.ANON_KEY || !localConfig.JWT_SECRET) {
        throw new Error("REST tests require the dedicated loopback Supabase API and private local keys");
      }
    }
    validateDatabaseUrl(selectedUrl!);
    client = new PrismaClient({ datasources: { db: { url: selectedUrl! } } });
    const schema = await readFile("prisma/schema.prisma", "utf8");
    models = [...schema.matchAll(/^model (\w+) \{/gm)].map(match => match[1]);
    if (!models.length || schema.includes("@@map(")) {
      throw new Error("Review security table coverage after a Prisma model mapping change");
    }
    const messagingSchema = await readFile("prisma/setup-messaging.sql", "utf8");
    const messagingTables = [...messagingSchema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+)\s*\(/gi)]
      .map(match => match[1].toLowerCase());
    if (!messagingTables.length) throw new Error("Messaging security coverage requires its table definitions");
    protectedTables = [...models, ...messagingTables];
    untouchedObjects = await snapshotUntouchedObjects();

    // Only this isolated test database may create missing API roles. Do not
    // change existing Supabase roles or their membership/bypass settings.
    await client.$executeRawUnsafe(`DO $test_roles$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        CREATE ROLE anon NOLOGIN;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
      END IF;
    END $test_roles$`);
    if (!localConfig) {
      // A column grant is an independent regression vector, rather than a
      // duplicate of the SQL's target list. No HTTP API exposes this database.
      await client.$executeRawUnsafe('GRANT SELECT (role), UPDATE (role) ON public."User" TO anon, authenticated, PUBLIC');
    }
    // A DO statement is itself atomic; the CLI's BEGIN/COMMIT wrappers are for
    // operator use. No other SQL/migration or remote connection is executed.
    for (const file of ["prisma/harden-lms-rls.sql", "prisma/harden-messaging-rls.sql"]) {
      const sql = (await readFile(file, "utf8"))
        .replace(/^BEGIN;\s*$/m, "").replace(/^COMMIT;\s*$/m, "");
      await client.$executeRawUnsafe(sql);
    }
  });

  afterAll(async () => {
    if (client) {
      // REST insertion vectors carry unique IDs even if a future regression
      // permits them. Only rows owned by this run are removed.
      await client.purchase.deleteMany({ where: { userId: prefix } });
      await client.user.deleteMany({ where: { id: { startsWith: prefix } } });
      await client.$disconnect();
    }
  });

  test("protects every Prisma model and messaging table and removes effective browser grants", async () => {
    const rows = await client.$queryRawUnsafe<Array<{ name: string; rls: boolean; forced: boolean }>>(`
      SELECT c.relname AS name, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced
      FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY($1::text[])
    `, protectedTables);
    expect(rows.map(row => row.name).sort()).toEqual([...protectedTables].sort());
    expect(rows.every(row => row.rls && !row.forced)).toBe(true);
    for (const role of browserRoles) {
      const grants = await client.$queryRawUnsafe<Array<{ table_access: boolean; column_access: boolean }>>(`
        SELECT has_table_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS table_access,
               has_any_column_privilege($1, c.oid, 'SELECT,INSERT,UPDATE,REFERENCES') AS column_access
        FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE n.nspname = 'public' AND c.relkind = 'r' AND c.relname = ANY($2::text[])
      `, role, protectedTables);
      expect(grants).toHaveLength(protectedTables.length);
      expect(grants.every(row => !row.table_access && !row.column_access)).toBe(true);
    }
  });

  test.each(browserRoles)("denies real SELECT/INSERT/UPDATE/DELETE statements as %s", async role => {
    for (const model of protectedTables) {
      const table = `public.${identifier(model)}`;
      const operations = [
        `SELECT id FROM ${table} LIMIT 1`,
        `INSERT INTO ${table} (id) SELECT '${prefix}' WHERE false`,
        `UPDATE ${table} SET id = id WHERE false`,
        `DELETE FROM ${table} WHERE false`,
      ];
      for (const operation of operations) {
        await expect(client.$transaction(async tx => {
          await tx.$executeRawUnsafe(`SET LOCAL ROLE ${identifier(role)}`);
          await tx.$queryRawUnsafe(operation);
        })).rejects.toMatchObject({ code: "P2010", meta: { code: "42501" } });
      }
    }
  });

  test("keeps owner Prisma CRUD available and leaves auth/storage/unrelated objects untouched", async () => {
    const rollback = new Error("rollback isolated owner fixture");
    await expect(client.$transaction(async tx => {
      await tx.user.create({ data: { id: prefix, email: `${prefix}@example.invalid`, role: "USER" } });
      await tx.user.update({ where: { id: prefix }, data: { name: "Isolated owner access" } });
      expect((await tx.user.findUnique({ where: { id: prefix } }))?.name).toBe("Isolated owner access");
      await tx.user.delete({ where: { id: prefix } });
      await tx.$executeRawUnsafe(`INSERT INTO public.messagethread
        (id, studentid, studentemail, studentname, subject, createdat, updatedat)
        VALUES ($1, $2, $3, 'Isolated student', 'Isolated owner message', $4, $4)`,
      prefix, prefix, `${prefix}@example.invalid`, new Date().toISOString());
      await tx.$executeRawUnsafe(`INSERT INTO public.message
        (id, threadid, senderid, senderemail, sendername, senderrole, body, createdat)
        VALUES ($1, $2, $2, $3, 'Isolated student', 'student', 'Initial content', $4)`,
      `${prefix}-message`, prefix, `${prefix}@example.invalid`, new Date().toISOString());
      await tx.$executeRawUnsafe("UPDATE public.message SET body = 'Updated content' WHERE id = $1", `${prefix}-message`);
      expect(await tx.$queryRawUnsafe("SELECT body FROM public.message WHERE id = $1", `${prefix}-message`))
        .toEqual([{ body: "Updated content" }]);
      await tx.$executeRawUnsafe("DELETE FROM public.message WHERE id = $1", `${prefix}-message`);
      await tx.$executeRawUnsafe("DELETE FROM public.messagethread WHERE id = $1", prefix);
      throw rollback;
    })).rejects.toBe(rollback);
    expect(await client.user.count({ where: { id: prefix } })).toBe(0);
    expect(await snapshotUntouchedObjects()).toEqual(untouchedObjects);
  });

  test.skipIf(!localConfigPath)("denies Supabase REST reads and role/entitlement writes for all browser identities", async () => {
    const fixture = JSON.parse(await readFile(
      process.env.LMS_DATABASE_SECURITY_FIXTURES || "/tmp/jazz-maintenance/fixture-users.json", "utf8",
    )) as { courseId: string; users: Record<string, { id: string; email: string }> };
    if (!fixture.courseId.startsWith("maintenance-") ||
        !fixture.users.free?.email.endsWith("@example.test") ||
        !fixture.users.admin?.email.endsWith("@example.test")) {
      throw new Error("REST probe requires the dedicated synthetic maintenance fixtures");
    }
    const signUser = (user: { id: string; email: string }) => {
      const now = Math.floor(Date.now() / 1000);
      const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({
        iss: `${localConfig!.API_URL}/auth/v1`, aud: "authenticated", role: "authenticated",
        sub: user.id, email: user.email, iat: now, exp: now + 300,
      })).toString("base64url");
      const input = `${header}.${payload}`;
      return `${input}.${createHmac("sha256", localConfig!.JWT_SECRET).update(input).digest("base64url")}`;
    };
    const tokens = [localConfig!.ANON_KEY, signUser(fixture.users.free), signUser(fixture.users.admin)];
    for (const token of tokens) {
      const headers = { apikey: localConfig!.ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const deny = async (table: string, method: string, query = "", body?: object) => {
        const response = await fetch(`${localConfig!.API_URL}/rest/v1/${encodeURIComponent(table)}${query}`, {
          method, headers, redirect: "error", body: body ? JSON.stringify(body) : undefined,
        });
        const result = await response.json();
        // Inspect only status/error code, so unexpected rows/credentials are
        // never printed in an assertion failure.
        expect([401, 403]).toContain(response.status);
        expect(result?.code).toBe("42501");
      };
      for (const model of protectedTables) await deny(model, "GET", `?select=id&id=eq.${prefix}`);
      await deny("User", "GET", `?select=id,role&id=eq.${fixture.users.admin.id}`);
      await deny("User", "PATCH", `?id=eq.${prefix}`, { role: "SUPER_ADMIN" });
      await deny("User", "DELETE", `?id=eq.${prefix}`);
      await deny("Purchase", "POST", "", {
        id: `${prefix}-purchase-${randomUUID()}`, userId: prefix, courseId: fixture.courseId,
        originalPrice: 80, finalPrice: 0, providerReferenceId: `${prefix}-forged`,
        updatedAt: new Date().toISOString(),
      });
      await deny("message", "PATCH", `?id=eq.${prefix}`, { senderrole: "professor", body: "Forged reply" });
      await deny("messagethread", "DELETE", `?id=eq.${prefix}`);
    }
  });
});

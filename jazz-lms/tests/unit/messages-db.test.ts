import { beforeEach, describe, expect, test, vi } from "vitest";

const mocks = vi.hoisted(() => ({ query: vi.fn(), execute: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { $queryRawUnsafe: mocks.query, $executeRawUnsafe: mocks.execute } }));

describe("messaging schema readiness", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.query.mockResolvedValue([]);
  });

  test("checks every required lowercase table column without runtime DDL", async () => {
    const { ensureMessagingTables } = await import("@/lib/messages-db");
    await ensureMessagingTables();
    expect(mocks.query).toHaveBeenCalledTimes(2);
    expect(mocks.query.mock.calls[0][0]).toContain("FROM messagethread LIMIT 0");
    expect(mocks.query.mock.calls[1][0]).toContain("unreadbystudent, unreadbyprofessor");
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  test("reports missing schema without exposing SQL details or trying to create it", async () => {
    mocks.query.mockRejectedValue(new Error('relation "messagethread" does not exist'));
    const { ensureMessagingTables } = await import("@/lib/messages-db");
    await expect(ensureMessagingTables()).rejects.toMatchObject({
      name: "MessagingSchemaUnavailableError", message: "Messaging temporarily unavailable",
    });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});

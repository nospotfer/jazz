import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

// These match the four migration records in the preserved recovery snapshot.
// They protect immutable SQL history; they do not prove SQL execution or schema
// compatibility. Later changes belong in a new migration, not an applied file.
const recordedMigrations = [
  [
    "202603080001_add_course_translations",
    "1603c85b2534e3887244f37411f216b7d6746dfadb43a549b5a22e5e698ee66a",
  ],
  [
    "202603110001_add_lesson_quiz",
    "4af2259f0a9cd1a0231feef356b4a3bc1ff810f101a54ecf1546e37c1011230a",
  ],
  [
    "202603120001_add_attachment_localization",
    "cda0a931d495b66832aad73d8e54bbadeea40495a849a02d258b00e8a5656f5c",
  ],
  [
    "202603180001_purchase_provider_reference",
    "d4c4904d32daf99e9385d4a338053ee88c7e2f1f6e6330a98684c3729d35ff63",
  ],
] as const;

describe("historically recorded migrations", () => {
  it.each(recordedMigrations)("%s keeps its recorded checksum", (name, checksum) => {
    const sql = readFileSync(resolve("prisma", "migrations", name, "migration.sql"));
    expect(createHash("sha256").update(sql).digest("hex")).toBe(checksum);
  });
});

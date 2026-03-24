import { describe, expect, test } from "vitest";

import {
    extractNormalizedEmail,
    isValidEmailAddress,
} from "@/lib/email-validation";

describe("email-validation", () => {
  test("accepts valid normalized emails", () => {
    expect(isValidEmailAddress("student@example.com")).toBe(true);
    expect(isValidEmailAddress("name.surname+tag@example-domain.com")).toBe(
      true,
    );
  });

  test("rejects malformed email formats", () => {
    expect(isValidEmailAddress("")).toBe(false);
    expect(isValidEmailAddress("plain-text")).toBe(false);
    expect(isValidEmailAddress("student@@example.com")).toBe(false);
    expect(isValidEmailAddress(".student@example.com")).toBe(false);
    expect(isValidEmailAddress("student@example")).toBe(false);
    expect(isValidEmailAddress("student@example..com")).toBe(false);
  });

  test("extracts address from display name and mailto forms", () => {
    expect(extractNormalizedEmail("Professor <TEACHER@Example.com>")).toBe(
      "teacher@example.com",
    );
    expect(extractNormalizedEmail("mailto:student@example.com")).toBe(
      "student@example.com",
    );
  });

  test("returns empty string when extraction is invalid", () => {
    expect(extractNormalizedEmail("invalid sender")).toBe("");
    expect(extractNormalizedEmail("Name <invalid@sender>")).toBe("");
  });
});

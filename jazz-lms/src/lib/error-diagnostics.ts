type DiagnosticCategory =
  | "invalid_request"
  | "timeout"
  | "database_unavailable"
  | "database_query_failed"
  | "constraint_failed"
  | "record_missing"
  | "request_rejected"
  | "service_unavailable"
  | "unexpected";

const DATABASE_ERRORS: Readonly<Record<string, DiagnosticCategory>> = {
  P1000: "database_unavailable",
  P1001: "database_unavailable",
  P1002: "timeout",
  P1011: "database_unavailable",
  P1017: "database_unavailable",
  P2002: "constraint_failed",
  P2003: "constraint_failed",
  P2010: "database_query_failed",
  P2021: "database_query_failed",
  P2022: "database_query_failed",
  P2025: "record_missing",
  P2028: "database_unavailable",
};

/** Only owned categories and bounded status/code values may reach diagnostics. */
export function safeErrorDiagnostic(error: unknown): {
  category: DiagnosticCategory;
  code?: string;
  status?: number;
} {
  try {
    if (error instanceof SyntaxError) return { category: "invalid_request" };
    if (!error || typeof error !== "object") return { category: "unexpected" };
    const fields = error as { name?: unknown; code?: unknown; status?: unknown };
    const name = fields.name;
    const code = fields.code;
    const status = fields.status;
    if (name === "AbortError" || name === "TimeoutError") {
      return { category: "timeout" };
    }
    if (typeof code === "string" && Object.hasOwn(DATABASE_ERRORS, code)) {
      return { category: DATABASE_ERRORS[code], code };
    }
    if (typeof status === "number" && Number.isInteger(status)
      && status >= 100 && status <= 599) {
      return {
        category: status >= 500 ? "service_unavailable" : "request_rejected",
        status,
      };
    }
  } catch {
    // Accessors on an arbitrary thrown object must not break error handling.
  }
  return { category: "unexpected" };
}

export function safeErrorReason(error: unknown): string {
  const diagnostic = safeErrorDiagnostic(error);
  const detail = diagnostic.code ?? diagnostic.status;
  return detail === undefined ? diagnostic.category : `${diagnostic.category} (${detail})`;
}

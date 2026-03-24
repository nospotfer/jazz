function hasOnlyAllowedLocalChars(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    const isLowerAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isAllowedSymbol =
      char === "." ||
      char === "_" ||
      char === "%" ||
      char === "+" ||
      char === "-";

    if (!isLowerAlpha && !isDigit && !isAllowedSymbol) {
      return false;
    }
  }

  return true;
}

function hasOnlyAllowedDomainChars(value: string) {
  for (const char of value) {
    const code = char.charCodeAt(0);
    const isLowerAlpha = code >= 97 && code <= 122;
    const isDigit = code >= 48 && code <= 57;
    const isAllowedSymbol = char === "." || char === "-";

    if (!isLowerAlpha && !isDigit && !isAllowedSymbol) {
      return false;
    }
  }

  return true;
}

export function isValidEmailAddress(rawEmail: string) {
  const email = rawEmail.trim().toLowerCase();

  if (!email || email.length > 254) {
    return false;
  }

  const atIndex = email.indexOf("@");
  if (
    atIndex <= 0 ||
    atIndex !== email.lastIndexOf("@") ||
    atIndex === email.length - 1
  ) {
    return false;
  }

  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);

  if (!local || !domain || local.length > 64) {
    return false;
  }

  if (
    local.startsWith(".") ||
    local.endsWith(".") ||
    domain.startsWith(".") ||
    domain.endsWith(".")
  ) {
    return false;
  }

  if (local.includes("..") || domain.includes("..")) {
    return false;
  }

  if (!domain.includes(".")) {
    return false;
  }

  if (!hasOnlyAllowedLocalChars(local) || !hasOnlyAllowedDomainChars(domain)) {
    return false;
  }

  return true;
}

export function extractNormalizedEmail(rawInput: string) {
  let candidate = rawInput.trim().toLowerCase();

  const ltIndex = candidate.lastIndexOf("<");
  const gtIndex = candidate.lastIndexOf(">");
  if (ltIndex !== -1 && gtIndex !== -1 && ltIndex < gtIndex) {
    candidate = candidate.slice(ltIndex + 1, gtIndex).trim();
  }

  if (candidate.startsWith("mailto:")) {
    candidate = candidate.slice("mailto:".length).trim();
  }

  return isValidEmailAddress(candidate) ? candidate : "";
}

/**
 * PII Redaction Proxy — tokenizes sensitive data before LLM calls.
 * De-tokenization occurs only inside our VPC after model response.
 */

const PII_PATTERNS: Array<{ name: string; regex: RegExp; replacement: string }> = [
  { name: "ssn", regex: /\b\d{3}-?\d{2}-?\d{4}\b/g, replacement: "[SSN_TOKEN]" },
  { name: "account", regex: /\b\d{8,17}\b/g, replacement: "[ACCT_TOKEN]" },
  {
    name: "dob",
    regex: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/(19|20)\d{2}\b/g,
    replacement: "[DOB_TOKEN]",
  },
  { name: "email", regex: /\b[\w.+-]+@[\w.-]+\.\w{2,}\b/g, replacement: "[EMAIL_TOKEN]" },
  { name: "phone", regex: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, replacement: "[PHONE_TOKEN]" },
];

export interface TokenMap {
  [token: string]: string;
}

export interface RedactionResult {
  redactedText: string;
  tokenMap: TokenMap;
  redactionCount: number;
}

let tokenCounter = 0;

function nextToken(type: string): string {
  tokenCounter += 1;
  return `<<${type}_${tokenCounter}>>`;
}

export function redactPii(text: string): RedactionResult {
  const tokenMap: TokenMap = {};
  let redactedText = text;
  let redactionCount = 0;

  for (const pattern of PII_PATTERNS) {
    redactedText = redactedText.replace(pattern.regex, (match) => {
      const token = nextToken(pattern.name.toUpperCase());
      tokenMap[token] = match;
      redactionCount += 1;
      return token;
    });
  }

  return { redactedText, tokenMap, redactionCount };
}

export function detokenize(text: string, tokenMap: TokenMap): string {
  let result = text;
  for (const [token, original] of Object.entries(tokenMap)) {
    result = result.replaceAll(token, original);
  }
  return result;
}

export function resetTokenCounter(): void {
  tokenCounter = 0;
}

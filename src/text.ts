export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  const normalized = normalizeText(text);

  if (normalized.length === 0) {
    return [];
  }

  return normalized.split(" ");
}

export function jaccardSimilarity(a: string, b: string): number {
  const leftTokens = new Set(tokenize(a));
  const rightTokens = new Set(tokenize(b));

  if (leftTokens.size === 0 && rightTokens.size === 0) {
    return 1;
  }

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const intersectionSize = [...leftTokens].filter((token) =>
    rightTokens.has(token)
  ).length;
  const unionSize = new Set([...leftTokens, ...rightTokens]).size;

  return intersectionSize / unionSize;
}
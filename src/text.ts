const STEM_OVERRIDES: Record<string, string> = {
  approved: "approve",
  damaged: "damage",
  qualifies: "qualify",
  resetting: "reset"
};

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

  return normalized.split(" ").map(stemToken);
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

function stemToken(token: string): string {
  const override = STEM_OVERRIDES[token];

  if (override !== undefined) {
    return override;
  }

  if (token.length > 5 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }

  if (token.length > 5 && token.endsWith("ing")) {
    return removeDoubledFinalConsonant(token.slice(0, -3));
  }

  if (token.length > 4 && token.endsWith("ed")) {
    const stem = token.slice(0, -2);

    if (stem.endsWith("g") || stem.endsWith("v")) {
      return `${stem}e`;
    }

    return stem;
  }

  if (token.length > 4 && token.endsWith("s") && !token.endsWith("ss")) {
    return token.slice(0, -1);
  }

  return token;
}

function removeDoubledFinalConsonant(token: string): string {
  const last = token.at(-1);
  const previous = token.at(-2);

  if (last !== undefined && last === previous && !"aeiou".includes(last)) {
    return token.slice(0, -1);
  }

  return token;
}
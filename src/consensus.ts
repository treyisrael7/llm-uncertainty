import { tokenize } from "./text";

const CONNECTOR_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "be",
  "been",
  "being",
  "for",
  "in",
  "is",
  "of",
  "on",
  "the",
  "to",
  "was",
  "were"
]);

export function extractConsensus(runs: string[]): string {
  if (runs.length === 0) {
    return "";
  }

  const tokenizedRuns = runs.map(tokenize);
  const majorityWords = getMajorityWords(tokenizedRuns, runs.length);
  const contentWords = [...majorityWords].filter((word) => !CONNECTOR_WORDS.has(word));

  if (contentWords.length < 2) {
    return getShortestRun(runs);
  }

  const sourceTokens = getBestSourceTokens(tokenizedRuns, majorityWords);
  const consensus = sourceTokens
    .filter((token, index) => shouldKeepToken(token, index, sourceTokens, majorityWords))
    .join(" ");

  return consensus.length > 0 ? consensus : getShortestRun(runs);
}

function getMajorityWords(tokenizedRuns: string[][], runCount: number): Set<string> {
  const threshold = Math.floor(runCount / 2) + 1;
  const counts = new Map<string, number>();

  for (const tokens of tokenizedRuns) {
    for (const token of new Set(tokens)) {
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return new Set(
    [...counts.entries()]
      .filter(([, count]) => count >= threshold)
      .map(([token]) => token)
  );
}

function getBestSourceTokens(
  tokenizedRuns: string[][],
  majorityWords: Set<string>
): string[] {
  return tokenizedRuns.reduce((bestTokens, tokens) => {
    const bestScore = countMajorityWords(bestTokens, majorityWords);
    const score = countMajorityWords(tokens, majorityWords);

    if (score > bestScore) {
      return tokens;
    }

    if (score === bestScore && tokens.length < bestTokens.length) {
      return tokens;
    }

    return bestTokens;
  }, tokenizedRuns[0]);
}

function shouldKeepToken(
  token: string,
  index: number,
  tokens: string[],
  majorityWords: Set<string>
): boolean {
  if (majorityWords.has(token)) {
    return true;
  }

  return (
    CONNECTOR_WORDS.has(token) &&
    hasContentWordBefore(index, tokens, majorityWords) &&
    hasContentWordAfter(index, tokens, majorityWords)
  );
}

function hasContentWordBefore(
  index: number,
  tokens: string[],
  majorityWords: Set<string>
): boolean {
  return tokens
    .slice(0, index)
    .some((token) => majorityWords.has(token) && !CONNECTOR_WORDS.has(token));
}

function hasContentWordAfter(
  index: number,
  tokens: string[],
  majorityWords: Set<string>
): boolean {
  return tokens
    .slice(index + 1)
    .some((token) => majorityWords.has(token) && !CONNECTOR_WORDS.has(token));
}

function countMajorityWords(tokens: string[], majorityWords: Set<string>): number {
  return tokens.filter((token) => majorityWords.has(token)).length;
}

function getShortestRun(runs: string[]): string {
  return runs.reduce((shortest, run) =>
    run.length < shortest.length ? run : shortest
  );
}
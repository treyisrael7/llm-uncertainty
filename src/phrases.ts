import type { UnstablePhrase } from "./types";

const UNSTABLE_PHRASES = [
  "might",
  "may",
  "could",
  "likely",
  "unlikely",
  "probably",
  "possibly",
  "seems",
  "appears",
  "roughly",
  "approximately",
  "unclear",
  "uncertain"
] as const;

export function findUnstablePhrases(runs: string[]): UnstablePhrase[] {
  return UNSTABLE_PHRASES.map((phrase) => {
    const matchesByRun = runs.map((run) => countPhrase(run, phrase));
    const count = matchesByRun.reduce((sum, matches) => sum + matches, 0);

    return {
      phrase,
      count,
      runs: matchesByRun.flatMap((matches, index) => (matches > 0 ? [index] : []))
    };
  }).filter((match) => match.count > 0);
}

function countPhrase(text: string, phrase: string): number {
  return text.match(new RegExp(`\\b${escapeRegExp(phrase)}\\b`, "giu"))?.length ?? 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
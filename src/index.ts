export { jaccardSimilarity, normalizeText, tokenize } from "./text";

export type {
  AnalyzeOptions,
  PairwiseComparison,
  UncertaintyResult,
  UnstablePhrase
} from "./types";

import { jaccardSimilarity, normalizeText } from "./text";

import type {
  AnalyzeOptions,
  PairwiseComparison,
  UncertaintyResult,
  UnstablePhrase
} from "./types";

const UNCERTAINTY_TERMS = [
  "likely",
  "may",
  "might",
  "could",
  "possibly",
  "probably",
  "appears",
  "seems",
  "unclear",
  "unknown"
] as const;

export function analyze(input: AnalyzeOptions): UncertaintyResult {
  if (input.runs.length === 0) {
    return {
      confidence: 0,
      variance: 1,
      consensus: "",
      unstablePhrases: [],
      outliers: [],
      comparisons: []
    };
  }

  const normalizedRuns = input.runs.map(normalizeText);
  const comparisons = compareRuns(input.runs);
  const averageSimilarity = getAverageSimilarity(comparisons);
  const confidence = round(averageSimilarity);
  const variance = round(1 - confidence);

  return {
    confidence,
    variance,
    consensus: input.runs[0],
    unstablePhrases: findUnstablePhrases(input.runs),
    outliers: findOutliers(input.runs, normalizedRuns, averageSimilarity),
    comparisons
  };
}

function compareRuns(values: string[]): PairwiseComparison[] {
  const comparisons: PairwiseComparison[] = [];

  for (let leftIndex = 0; leftIndex < values.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < values.length; rightIndex += 1) {
      comparisons.push({
        leftIndex,
        rightIndex,
        similarity: round(jaccardSimilarity(values[leftIndex], values[rightIndex]))
      });
    }
  }

  return comparisons;
}

function getAverageSimilarity(comparisons: PairwiseComparison[]): number {
  if (comparisons.length === 0) {
    return 1;
  }

  return (
    comparisons.reduce((sum, comparison) => sum + comparison.similarity, 0) /
    comparisons.length
  );
}

function findUnstablePhrases(runs: string[]): UnstablePhrase[] {
  const combined = runs.join(" ").toLowerCase();

  return UNCERTAINTY_TERMS.map((term) => ({
    phrase: term,
    count: countPhrase(combined, term)
  })).filter((term) => term.count > 0);
}

function countPhrase(value: string, phrase: string): number {
  return value.match(new RegExp(`\\b${phrase}\\b`, "gu"))?.length ?? 0;
}

function findOutliers(
  runs: string[],
  normalizedRuns: string[],
  averageSimilarity: number
): string[] {
  if (runs.length < 3) {
    return [];
  }

  return runs.filter((_, index) => {
    const otherRuns = normalizedRuns.filter((__, otherIndex) => otherIndex !== index);
    const similarities = otherRuns.map((run) =>
      jaccardSimilarity(normalizedRuns[index], run)
    );
    const runAverage =
      similarities.reduce((sum, score) => sum + score, 0) / similarities.length;

    return runAverage < averageSimilarity / 2;
  });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
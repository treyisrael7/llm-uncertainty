export interface AnalyzeInput {
  runs: string[];
}

export interface AnalyzeResult {
  confidence: number;
  variance: number;
  consensus: string;
  unstablePhrases: string[];
  outliers: string[];
}

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

export function analyze(input: AnalyzeInput): AnalyzeResult {
  if (input.runs.length === 0) {
    return {
      confidence: 0,
      variance: 1,
      consensus: "",
      unstablePhrases: [],
      outliers: []
    };
  }

  const normalizedRuns = input.runs.map(normalizeText);
  const averageSimilarity = getAveragePairwiseSimilarity(normalizedRuns);
  const confidence = round(averageSimilarity);
  const variance = round(1 - confidence);

  return {
    confidence,
    variance,
    consensus: input.runs[0],
    unstablePhrases: findUnstablePhrases(input.runs),
    outliers: findOutliers(input.runs, normalizedRuns, averageSimilarity)
  };
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, "").trim();
}

function getAveragePairwiseSimilarity(values: string[]): number {
  if (values.length === 1) {
    return 1;
  }

  const scores: number[] = [];

  for (let left = 0; left < values.length; left += 1) {
    for (let right = left + 1; right < values.length; right += 1) {
      scores.push(getJaccardSimilarity(values[left], values[right]));
    }
  }

  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

function getJaccardSimilarity(left: string, right: string): number {
  const leftWords = new Set(left.split(/\s+/).filter(Boolean));
  const rightWords = new Set(right.split(/\s+/).filter(Boolean));

  if (leftWords.size === 0 && rightWords.size === 0) {
    return 1;
  }

  const intersection = [...leftWords].filter((word) => rightWords.has(word));
  const union = new Set([...leftWords, ...rightWords]);

  return intersection.length / union.size;
}

function findUnstablePhrases(runs: string[]): string[] {
  const combined = runs.join(" ").toLowerCase();

  return UNCERTAINTY_TERMS.filter((term) =>
    new RegExp(`\\b${term}\\b`, "u").test(combined)
  );
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
      getJaccardSimilarity(normalizedRuns[index], run)
    );
    const runAverage =
      similarities.reduce((sum, score) => sum + score, 0) / similarities.length;

    return runAverage < averageSimilarity / 2;
  });
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

import { extractConsensus } from "./consensus";
import { detectAgreementSignal, detectDisagreement } from "./disagreement";
import { detectOutliers } from "./outliers";
import { findUnstablePhrases } from "./phrases";
import { jaccardSimilarity } from "./text";

import type {
  AnalysisStatus,
  AnalyzeOptions,
  AnalyzeThresholds,
  AnalyzerOptions,
  AnalyzerStrictness,
  DisagreementCluster,
  PairwiseComparison,
  UncertaintyResult
} from "./types";

const STRICTNESS_MIN_AGREEMENT = {
  loose: 0.3,
  normal: 0.4,
  strict: 0.8
} satisfies Record<AnalyzerStrictness, number>;

const DEFAULT_THRESHOLDS = {
  stable: 0.75,
  unstable: 0.4,
  agreement: STRICTNESS_MIN_AGREEMENT.normal
} satisfies Required<AnalyzeThresholds>;

const LOW_SIMILARITY_THRESHOLD = 0.2;

export function analyze(runs: string[], options?: AnalyzerOptions): UncertaintyResult;
export function analyze(options: AnalyzeOptions): UncertaintyResult;
export function analyze(
  input: string[] | AnalyzeOptions,
  options: AnalyzerOptions = {}
): UncertaintyResult {
  const analysisOptions = normalizeAnalyzeInput(input, options);

  return analyzeRuns(analysisOptions);
}

function analyzeRuns(options: AnalyzeOptions): UncertaintyResult {
  if (options.runs.length < 2) {
    throw new Error("analyze requires at least two runs");
  }

  const thresholds = resolveThresholds(
    options.thresholds,
    options.minAgreement,
    options.strictness
  );
  const comparisons = compareRuns(options.runs);
  const clusters = buildClusters(
    options.runs,
    comparisons,
    thresholds.agreement,
    options.customGroups
  );
  const confidence = calculateConfidence(options.runs, comparisons, clusters, thresholds);
  const variance = roundToTwoDecimals(1 - confidence);
  const outliers = detectOutliers(options.runs, comparisons, clusters);
  const status = getStatus(options.runs, comparisons, clusters, confidence, outliers, thresholds);

  const result: UncertaintyResult = {
    status,
    confidence,
    variance,
    consensus: extractConsensus(options.runs),
    outliers
  };

  if (options.verbose === true) {
    result.details = {
      method: "heuristic",
      unstablePhrases: findUnstablePhrases(options.runs),
      comparisons,
      clusters
    };
  }

  return result;
}

function normalizeAnalyzeInput(
  input: string[] | AnalyzeOptions,
  options: AnalyzerOptions
): AnalyzeOptions {
  if (Array.isArray(input)) {
    return {
      runs: input,
      customGroups: options.customGroups,
      minAgreement: options.minAgreement,
      strictness: options.strictness,
      verbose: options.verbose
    };
  }

  return input;
}

function compareRuns(runs: string[]): PairwiseComparison[] {
  const comparisons: PairwiseComparison[] = [];

  for (let leftIndex = 0; leftIndex < runs.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < runs.length; rightIndex += 1) {
      comparisons.push({
        leftIndex,
        rightIndex,
        similarity: jaccardSimilarity(runs[leftIndex], runs[rightIndex]),
        disagrees: detectDisagreement(runs[leftIndex], runs[rightIndex])
      });
    }
  }

  return comparisons;
}

function buildClusters(
  runs: string[],
  comparisons: PairwiseComparison[],
  agreementThreshold: number,
  customGroups: AnalyzeOptions["customGroups"] = {}
): DisagreementCluster[] {
  const clusterIndexes: number[][] = [];

  for (let index = 0; index < runs.length; index += 1) {
    const cluster = clusterIndexes.find((candidate) =>
      agreesWithCluster(index, candidate, runs, comparisons, agreementThreshold, customGroups)
    );

    if (cluster === undefined) {
      clusterIndexes.push([index]);
    } else {
      cluster.push(index);
    }
  }

  return clusterIndexes
    .map((indexes) => ({
      indexes,
      items: indexes.map((runIndex) => runs[runIndex]),
      averageSimilarity: roundToTwoDecimals(getClusterAverageSimilarity(indexes, comparisons))
    }))
    .sort((left, right) => right.indexes.length - left.indexes.length);
}

function agreesWithCluster(
  index: number,
  cluster: number[],
  runs: string[],
  comparisons: PairwiseComparison[],
  agreementThreshold: number,
  customGroups: AnalyzeOptions["customGroups"] = {}
): boolean {
  return cluster.every((clusterIndex) => {
    const comparison = getComparison(index, clusterIndex, comparisons);

    return (
      comparison !== undefined &&
      runsAgree(comparison, runs[index], runs[clusterIndex], agreementThreshold, customGroups)
    );
  });
}

function runsAgree(
  comparison: PairwiseComparison,
  left: string,
  right: string,
  agreementThreshold: number,
  customGroups: AnalyzeOptions["customGroups"] = {}
): boolean {
  if (comparison.disagrees) {
    return false;
  }

  return (
    comparison.similarity > agreementThreshold ||
    detectAgreementSignal(left, right, customGroups)
  );
}

function calculateConfidence(
  runs: string[],
  comparisons: PairwiseComparison[],
  clusters: DisagreementCluster[],
  thresholds: Required<AnalyzeThresholds>
): number {
  const largestCluster = clusters[0];
  const coverage = largestCluster === undefined
    ? 0
    : largestCluster.indexes.length / runs.length;
  const clusterQuality = largestCluster === undefined || largestCluster.indexes.length === 1
    ? 0.2
    : largestCluster.averageSimilarity;
  const lowSimilarityRate =
    comparisons.filter((comparison) => comparison.similarity < LOW_SIMILARITY_THRESHOLD).length /
    comparisons.length;
  const lowSimilarityPenalty = lowSimilarityRate > 0.5 ? thresholds.unstable + 0.2 : 1;
  const confidence = coverage * (0.8 + clusterQuality * 0.2) * lowSimilarityPenalty;

  return roundToTwoDecimals(clamp(confidence, 0, 1));
}

function getStatus(
  runs: string[],
  comparisons: PairwiseComparison[],
  clusters: DisagreementCluster[],
  confidence: number,
  outliers: string[],
  thresholds: Required<AnalyzeThresholds>
): AnalysisStatus {
  const largestCluster = clusters[0];
  const largestClusterSize = largestCluster?.indexes.length ?? 0;
  const largestClusterCoverage = largestClusterSize / runs.length;
  const meaningfulClusters = clusters.filter((cluster) => cluster.indexes.length > 1);
  const hasDisagreements = comparisons.some((comparison) => comparison.disagrees);

  if (meaningfulClusters.length === 0 && confidence < thresholds.unstable) {
    return "no-consensus";
  }

  if (meaningfulClusters.length > 1 && hasDisagreements) {
    return "split";
  }

  if (
    confidence >= thresholds.stable &&
    largestClusterCoverage >= thresholds.stable &&
    !hasDisagreements &&
    outliers.length === 0
  ) {
    return "stable";
  }

  return "unstable";
}

function getClusterAverageSimilarity(
  indexes: number[],
  comparisons: PairwiseComparison[]
): number {
  if (indexes.length === 1) {
    return 1;
  }

  const indexSet = new Set(indexes);
  const clusterComparisons = comparisons.filter(
    (comparison) =>
      indexSet.has(comparison.leftIndex) && indexSet.has(comparison.rightIndex)
  );

  return getAverageSimilarity(clusterComparisons);
}

function getComparison(
  leftIndex: number,
  rightIndex: number,
  comparisons: PairwiseComparison[]
): PairwiseComparison | undefined {
  return comparisons.find(
    (comparison) =>
      (comparison.leftIndex === leftIndex && comparison.rightIndex === rightIndex) ||
      (comparison.leftIndex === rightIndex && comparison.rightIndex === leftIndex)
  );
}

function getAverageSimilarity(comparisons: PairwiseComparison[]): number {
  if (comparisons.length === 0) {
    return 0;
  }

  return (
    comparisons.reduce((sum, comparison) => sum + comparison.similarity, 0) /
    comparisons.length
  );
}

function resolveThresholds(
  thresholds: AnalyzeThresholds | undefined,
  minAgreement: number | undefined,
  strictness: AnalyzerStrictness = "normal"
): Required<AnalyzeThresholds> {
  return {
    stable: thresholds?.stable ?? DEFAULT_THRESHOLDS.stable,
    unstable: thresholds?.unstable ?? DEFAULT_THRESHOLDS.unstable,
    agreement: minAgreement ?? thresholds?.agreement ?? STRICTNESS_MIN_AGREEMENT[strictness]
  };
}

function roundToTwoDecimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

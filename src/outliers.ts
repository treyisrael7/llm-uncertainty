import type { DisagreementCluster, PairwiseComparison } from "./types";

const NEGATION_PATTERN = /\b(?:not|no|never|none|cannot)\b|\bcan't\b/iu;
const LOW_CLUSTER_SIMILARITY_THRESHOLD = 0.2;

export function detectOutliers(
  runs: string[],
  comparisons: PairwiseComparison[],
  clusters: DisagreementCluster[] = []
): string[] {
  if (runs.length < 3 || comparisons.length === 0) {
    return [];
  }

  if (clusters.length > 0) {
    return detectClusterOutliers(runs, comparisons, clusters);
  }

  const overallAverage = getAverageSimilarity(comparisons);
  const similarityThreshold = overallAverage / 2;
  const negationOutlierIndexes = getNegationOutlierIndexes(runs);
  const disagreementOutlierIndexes = getDisagreementOutlierIndexes(runs, comparisons);

  return runs.filter((_, index) => {
    const runComparisons = getRunComparisons(index, comparisons);
    const runAverage = getAverageSimilarity(runComparisons);

    return (
      runAverage < similarityThreshold ||
      negationOutlierIndexes.has(index) ||
      disagreementOutlierIndexes.has(index)
    );
  });
}

function detectClusterOutliers(
  runs: string[],
  comparisons: PairwiseComparison[],
  clusters: DisagreementCluster[]
): string[] {
  const largestCluster = clusters[0];

  if (largestCluster === undefined) {
    return [];
  }

  const largestClusterIndexes = new Set(largestCluster.indexes);

  return clusters.flatMap((cluster) => {
    if (cluster === largestCluster) {
      return cluster.indexes
        .filter((index) => disagreesWithMostOfCluster(index, largestCluster.indexes, comparisons))
        .map((index) => runs[index]);
    }

    if (cluster.indexes.length > 1) {
      return [];
    }

    const [index] = cluster.indexes;

    if (index === undefined || largestClusterIndexes.has(index)) {
      return [];
    }

    if (
      disagreesWithMostOfCluster(index, largestCluster.indexes, comparisons) ||
      averageSimilarityToCluster(index, largestCluster.indexes, comparisons) <
        LOW_CLUSTER_SIMILARITY_THRESHOLD
    ) {
      return [runs[index]];
    }

    return [];
  });
}

function disagreesWithMostOfCluster(
  index: number,
  clusterIndexes: number[],
  comparisons: PairwiseComparison[]
): boolean {
  const otherIndexes = clusterIndexes.filter((clusterIndex) => clusterIndex !== index);

  if (otherIndexes.length === 0) {
    return false;
  }

  const disagreementCount = otherIndexes.filter((clusterIndex) =>
    getComparison(index, clusterIndex, comparisons)?.disagrees === true
  ).length;

  return disagreementCount > otherIndexes.length / 2;
}

function averageSimilarityToCluster(
  index: number,
  clusterIndexes: number[],
  comparisons: PairwiseComparison[]
): number {
  const clusterComparisons = clusterIndexes
    .filter((clusterIndex) => clusterIndex !== index)
    .map((clusterIndex) => getComparison(index, clusterIndex, comparisons))
    .filter((comparison): comparison is PairwiseComparison => comparison !== undefined);

  return getAverageSimilarity(clusterComparisons);
}

function getDisagreementOutlierIndexes(
  runs: string[],
  comparisons: PairwiseComparison[]
): Set<number> {
  const disagreementCounts = runs.map((_, index) =>
    comparisons.filter(
      (comparison) =>
        comparison.disagrees &&
        (comparison.leftIndex === index || comparison.rightIndex === index)
    ).length
  );
  const isolatedDisagreementIndexes = disagreementCounts.flatMap((count, index) =>
    count === runs.length - 1 ? [index] : []
  );

  if (isolatedDisagreementIndexes.length >= runs.length / 2) {
    return new Set();
  }

  return new Set(isolatedDisagreementIndexes);
}

function getNegationOutlierIndexes(runs: string[]): Set<number> {
  const negationByRun = runs.map(hasNegation);
  const negatedCount = negationByRun.filter(Boolean).length;
  const nonNegatedCount = runs.length - negatedCount;

  if (negatedCount === 0 || nonNegatedCount === 0) {
    return new Set();
  }

  const majorityHasNegation = negatedCount > runs.length / 2;
  const majorityHasNoNegation = nonNegatedCount > runs.length / 2;

  if (!majorityHasNegation && !majorityHasNoNegation) {
    return new Set();
  }

  return new Set(
    negationByRun.flatMap((hasNegationPattern, index) => {
      const differsFromMajority = majorityHasNegation
        ? !hasNegationPattern
        : hasNegationPattern;

      return differsFromMajority ? [index] : [];
    })
  );
}

function hasNegation(text: string): boolean {
  return NEGATION_PATTERN.test(text);
}

function getRunComparisons(
  index: number,
  comparisons: PairwiseComparison[]
): PairwiseComparison[] {
  return comparisons.filter(
    (comparison) => comparison.leftIndex === index || comparison.rightIndex === index
  );
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
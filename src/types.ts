export interface AnalyzeOptions {
  runs: string[];
}

export interface UnstablePhrase {
  phrase: string;
  count: number;
}

export interface PairwiseComparison {
  leftIndex: number;
  rightIndex: number;
  similarity: number;
}

export interface UncertaintyResult {
  confidence: number;
  variance: number;
  consensus: string;
  unstablePhrases: UnstablePhrase[];
  outliers: string[];
  comparisons: PairwiseComparison[];
}

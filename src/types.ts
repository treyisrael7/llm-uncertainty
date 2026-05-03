export interface AnalyzeOptions {
  runs: string[];
  customGroups?: CustomGroups;
  thresholds?: AnalyzeThresholds;
  verbose?: boolean;
}

export interface AnalyzeThresholds {
  stable?: number;
  unstable?: number;
  agreement?: number;
}

export type AnalysisStatus = "stable" | "unstable" | "split" | "no-consensus";

export type CustomGroups = Record<string, string[]>;

export interface UnstablePhrase {
  phrase: string;
  count: number;
  runs: number[];
}

export interface PairwiseComparison {
  leftIndex: number;
  rightIndex: number;
  similarity: number;
  disagrees: boolean;
}

export interface DisagreementCluster {
  indexes: number[];
  items: string[];
  averageSimilarity: number;
}

export interface AnalysisDetails {
  method: "heuristic";
  unstablePhrases: UnstablePhrase[];
  comparisons: PairwiseComparison[];
  clusters: DisagreementCluster[];
}

export interface UncertaintyResult {
  status: AnalysisStatus;
  confidence: number;
  variance: number;
  consensus: string;
  outliers: string[];
  details?: AnalysisDetails;
}
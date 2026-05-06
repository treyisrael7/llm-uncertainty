export interface AnalyzerOptions {
  customGroups?: CustomGroups;
  minAgreement?: number;
  outlierDetector?: OutlierDetector;
  strictness?: AnalyzerStrictness;
  verbose?: boolean;
}

export interface AnalyzeOptions extends AnalyzerOptions {
  runs: string[];
  thresholds?: AnalyzeThresholds;
}

export interface AnalyzeThresholds {
  stable?: number;
  unstable?: number;
  agreement?: number;
}

export type AnalysisStatus = "stable" | "unstable" | "split" | "no-consensus";

export type AnalyzerStrictness = "loose" | "normal" | "strict";

export type CustomGroups = Record<string, string[]>;

export type OutlierDetector = (runs: string[]) => string[];

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
  explanation?: string;
  details?: AnalysisDetails;
}
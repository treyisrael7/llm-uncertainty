import { describe, expect, it } from "vitest";
import { analyze } from "../src";

import type { AnalyzeOptions, UncertaintyResult } from "../src";

describe("analyze", () => {
  it("scores similar LLM outputs and reports uncertainty terms", () => {
    const input: AnalyzeOptions = {
      runs: [
        "The customer is likely eligible for a refund.",
        "The customer may be eligible for a refund.",
        "The customer could qualify for a refund."
      ]
    };

    const result: UncertaintyResult = analyze(input);

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.variance).toBe(1 - result.confidence);
    expect(result.unstablePhrases).toEqual([
      { phrase: "likely", count: 1 },
      { phrase: "may", count: 1 },
      { phrase: "could", count: 1 }
    ]);
    expect(result.comparisons).toHaveLength(3);
    expect(result.outliers).toEqual([]);
  });

  it("returns an empty result for no runs", () => {
    expect(analyze({ runs: [] })).toEqual({
      confidence: 0,
      variance: 1,
      consensus: "",
      unstablePhrases: [],
      outliers: [],
      comparisons: []
    });
  });
});

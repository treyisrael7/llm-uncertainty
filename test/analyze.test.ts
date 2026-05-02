import { describe, expect, it } from "vitest";
import { analyze } from "../src";

describe("analyze", () => {
  it("scores similar LLM outputs and reports uncertainty terms", () => {
    const result = analyze({
      runs: [
        "The customer is likely eligible for a refund.",
        "The customer may be eligible for a refund.",
        "The customer could qualify for a refund."
      ]
    });

    expect(result.confidence).toBeGreaterThan(0);
    expect(result.variance).toBe(1 - result.confidence);
    expect(result.unstablePhrases).toEqual(["likely", "may", "could"]);
    expect(result.outliers).toEqual([]);
  });

  it("returns an empty result for no runs", () => {
    expect(analyze({ runs: [] })).toEqual({
      confidence: 0,
      variance: 1,
      consensus: "",
      unstablePhrases: [],
      outliers: []
    });
  });
});

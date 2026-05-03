import { describe, expect, it } from "vitest";
import { analyze } from "../src";

describe("verbose output", () => {
  it("returns a clean result shape by default", () => {
    const result = analyze({
      runs: ["The refund was approved.", "The refund was approved."]
    });

    expect(Object.keys(result).sort()).toEqual([
      "confidence",
      "consensus",
      "outliers",
      "status",
      "variance"
    ]);
    expect(result.details).toBeUndefined();
  });

  it("includes debug details when verbose is true", () => {
    const result = analyze({
      verbose: true,
      runs: ["The refund was approved.", "The refund was approved."]
    });

    expect(result.details).toEqual({
      method: "heuristic",
      unstablePhrases: [],
      comparisons: [
        { leftIndex: 0, rightIndex: 1, similarity: 1, disagrees: false }
      ],
      clusters: [
        {
          indexes: [0, 1],
          items: ["The refund was approved.", "The refund was approved."],
          averageSimilarity: 1
        }
      ]
    });
  });
});
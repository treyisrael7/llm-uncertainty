import { describe, expect, it } from "vitest";
import { analyze } from "../src";

describe("analyze", () => {
  it("accepts outputs directly", () => {
    const runs = ["alpha beta", "alpha beta", "alpha gamma"];

    expect(analyze(runs)).toEqual(analyze({ runs }));
  });

  it("accepts an optional analyzer options object", () => {
    const result = analyze(["alpha beta", "alpha gamma"], {
      minAgreement: 0.3,
      verbose: true
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1]);
  });

  it("uses loose strictness for more forgiving clustering", () => {
    const result = analyze(["alpha beta", "alpha gamma"], {
      strictness: "loose",
      verbose: true
    });

    expect(result.status).toBe("stable");
    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1]);
  });

  it("keeps normal strictness aligned with current behavior", () => {
    const directResult = analyze(["alpha beta", "alpha gamma"], {
      strictness: "normal",
      verbose: true
    });
    const defaultResult = analyze(["alpha beta", "alpha gamma"], {
      verbose: true
    });

    expect(directResult).toEqual(defaultResult);
    expect(directResult.status).toBe("unstable");
    expect(directResult.details?.clusters).toHaveLength(2);
  });

  it("uses strict strictness to mark outputs unstable more easily", () => {
    const runs = [
      "alpha beta gamma",
      "alpha beta gamma",
      "alpha beta delta",
      "alpha beta delta"
    ];

    expect(analyze(runs).status).toBe("stable");

    const result = analyze(runs, {
      strictness: "strict",
      verbose: true
    });

    expect(result.status).toBe("unstable");
    expect(result.details?.clusters.map((cluster) => cluster.indexes)).toEqual([
      [0, 1],
      [2, 3]
    ]);
  });

  it("lets minAgreement override strictness", () => {
    const result = analyze(["alpha beta", "alpha gamma"], {
      minAgreement: 0.3,
      strictness: "strict",
      verbose: true
    });

    expect(result.status).toBe("stable");
    expect(result.details?.clusters).toHaveLength(1);
  });

  it("throws if fewer than two runs are provided", () => {
    expect(() => analyze({
      runs: [],
      verbose: true
    })).toThrow("at least two runs");
    expect(() => analyze({
      runs: ["Only one output"],
      verbose: true
    })).toThrow("at least two runs");
    expect(() => analyze([])).toThrow("at least two runs");
  });

  it("returns confidence and variance from the strongest agreement cluster", () => {
    const result = analyze({
      verbose: true,
      runs: ["alpha beta", "alpha beta", "alpha gamma"]
    });

    expect(result.confidence).toBe(0.67);
    expect(result.variance).toBe(0.33);
    expect(result.consensus).toBe("alpha beta");
  });

  it("creates pairwise comparisons with disagreement flags", () => {
    const result = analyze({
      verbose: true,
      runs: ["alpha beta", "alpha beta", "alpha gamma"]
    });

    expect(result.details?.comparisons).toHaveLength(3);
    expect(result.details?.comparisons).toEqual([
      { leftIndex: 0, rightIndex: 1, similarity: 1, disagrees: false },
      { leftIndex: 0, rightIndex: 2, similarity: 1 / 3, disagrees: false },
      { leftIndex: 1, rightIndex: 2, similarity: 1 / 3, disagrees: false }
    ]);
  });

  it("includes unstable phrases in the result", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The result might be correct.",
        "The result may be correct and possibly incomplete."
      ]
    });

    expect(result.details?.unstablePhrases).toEqual([
      { phrase: "might", count: 1, runs: [0] },
      { phrase: "may", count: 1, runs: [1] },
      { phrase: "possibly", count: 1, runs: [1] }
    ]);
  });

  it("uses extracted consensus instead of the first run", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The customer is likely eligible for a refund.",
        "The customer may be eligible for a refund.",
        "The customer could qualify for a refund."
      ]
    });

    expect(result.consensus).toBe("the customer is eligible for a refund");
  });

  it("includes outliers in the result", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The customer is eligible for a refund.",
        "The customer qualifies for a refund.",
        "The customer can receive a refund.",
        "The package was delivered yesterday."
      ]
    });

    expect(result.outliers).toEqual(["The package was delivered yesterday."]);
  });

  it("gives completely unrelated sentences low confidence", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The stock will increase tomorrow.",
        "Soup is ready for dinner.",
        "The user reset their password.",
        "A package arrived yesterday."
      ]
    });

    expect(result.confidence).toBeGreaterThanOrEqual(0.1);
    expect(result.confidence).toBeLessThanOrEqual(0.3);
    expect(result.details?.clusters).toHaveLength(4);
  });

  it("forms two clusters for competing stock directions", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The stock will increase tomorrow.",
        "The stock should increase tomorrow.",
        "The stock will decrease tomorrow.",
        "The stock should decrease tomorrow."
      ]
    });

    expect(result.details?.clusters).toEqual([
      {
        indexes: [0, 1],
        items: [
          "The stock will increase tomorrow.",
          "The stock should increase tomorrow."
        ],
        averageSimilarity: 0.67
      },
      {
        indexes: [2, 3],
        items: [
          "The stock will decrease tomorrow.",
          "The stock should decrease tomorrow."
        ],
        averageSimilarity: 0.67
      }
    ]);
    expect(result.outliers).toEqual([]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.4);
    expect(result.confidence).toBeLessThanOrEqual(0.55);
  });

  it("keeps one strong cluster and one outlier for random noise", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "Refund approved.",
        "Refund approved.",
        "Refund approved.",
        "The weather forecast mentions rain."
      ]
    });

    expect(result.outliers).toEqual(["The weather forecast mentions rain."]);
    expect(result.details?.clusters[0]).toEqual({
      indexes: [0, 1, 2],
      items: ["Refund approved.", "Refund approved.", "Refund approved."],
      averageSimilarity: 1
    });
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it("separates approved and declined into different clusters", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The application was approved.",
        "The application was approved.",
        "The application was declined."
      ]
    });

    expect(result.details?.clusters).toEqual([
      {
        indexes: [0, 1],
        items: [
          "The application was approved.",
          "The application was approved."
        ],
        averageSimilarity: 1
      },
      {
        indexes: [2],
        items: ["The application was declined."],
        averageSimilarity: 1
      }
    ]);
    expect(result.details?.comparisons.filter((comparison) => comparison.disagrees)).toHaveLength(2);
  });
  it("clusters approved, accepted, and went through together", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The refund was approved.",
        "The refund was accepted.",
        "The refund went through."
      ]
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
  });

  it("marks approved vs declined as disagreement in pairwise comparisons", () => {
    const result = analyze({
      verbose: true,
      runs: ["Refund approved", "Refund declined"]
    });

    expect(result.details?.comparisons).toEqual([
      { leftIndex: 0, rightIndex: 1, similarity: 1 / 3, disagrees: true }
    ]);
  });

  it("clusters increase and rise together", () => {
    const result = analyze({
      verbose: true,
      runs: ["The stock will increase.", "The stock may rise."]
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1]);
  });

  it("clusters decrease and fall together", () => {
    const result = analyze({
      verbose: true,
      runs: ["The stock will decrease.", "The stock may fall."]
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1]);
  });

  it("separates increase/rise and decrease/fall into two clusters", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The stock will increase.",
        "The stock may rise.",
        "The stock will decrease.",
        "The stock may fall."
      ]
    });

    expect(result.details?.clusters.map((cluster) => cluster.indexes)).toEqual([
      [0, 1],
      [2, 3]
    ]);
    expect(result.details?.comparisons.filter((comparison) => comparison.disagrees)).toHaveLength(4);
  });
});


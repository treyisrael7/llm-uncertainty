import { describe, expect, it } from "vitest";
import { analyze } from "../src";

describe("analysis status", () => {
  it("marks identical outputs as stable", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The refund was approved.",
        "The refund was approved.",
        "The refund was approved."
      ]
    });

    expect(result.status).toBe("stable");
    expect(result.confidence).toBe(1);
  });

  it("keeps a strong main cluster when one random noise outlier appears", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The refund was approved.",
        "The refund was approved.",
        "The refund was approved.",
        "The weather forecast mentions rain."
      ]
    });

    expect(result.status).toBe("unstable");
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
    expect(result.outliers).toEqual(["The weather forecast mentions rain."]);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it("detects negation disagreement as an outlier", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The customer is eligible for a refund.",
        "The customer could qualify for a refund.",
        "The customer is not eligible for a refund."
      ]
    });

    expect(result.status).toBe("unstable");
    expect(result.outliers).toEqual(["The customer is not eligible for a refund."]);
  });

  it("marks two competing clusters as split", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The stock will increase tomorrow.",
        "The stock may rise tomorrow.",
        "The stock will decrease tomorrow.",
        "The stock may fall tomorrow."
      ]
    });

    expect(result.status).toBe("split");
    expect(result.details?.clusters.map((cluster) => cluster.indexes)).toEqual([[0, 1], [2, 3]]);
  });

  it("marks unrelated outputs as no-consensus", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The stock will increase tomorrow.",
        "Soup is ready for dinner.",
        "The user reset their password.",
        "A package arrived yesterday."
      ]
    });

    expect(result.status).toBe("no-consensus");
    expect(result.confidence).toBeLessThan(0.4);
  });

  it("uses custom agreement thresholds for clustering", () => {
    const result = analyze({
      verbose: true,
      runs: ["alpha beta", "alpha gamma"],
      thresholds: { agreement: 0.3 }
    });

    expect(result.details?.clusters).toHaveLength(1);
  });
});

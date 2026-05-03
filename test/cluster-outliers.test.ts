import { describe, expect, it } from "vitest";
import { analyze } from "../src";

describe("cluster-aware outliers", () => {
  it("does not flag approved, accepted, or went-through items in the largest cluster", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The payment was approved.",
        "The payment was accepted.",
        "The payment went through without issues.",
        "The payment was declined due to insufficient funds."
      ]
    });

    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
    expect(result.outliers).not.toContain("The payment was approved.");
    expect(result.outliers).not.toContain("The payment was accepted.");
    expect(result.outliers).not.toContain("The payment went through without issues.");
  });

  it("keeps declined due to insufficient funds as an outlier", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The payment was approved.",
        "The payment was accepted.",
        "The payment went through without issues.",
        "The payment was declined due to insufficient funds."
      ]
    });

    expect(result.outliers).toEqual([
      "The payment was declined due to insufficient funds."
    ]);
  });

  it("still flags random noise singleton clusters", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The payment was approved.",
        "The payment was accepted.",
        "The payment went through without issues.",
        "The weather forecast mentions rain tomorrow."
      ]
    });

    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
    expect(result.outliers).toEqual([
      "The weather forecast mentions rain tomorrow."
    ]);
  });

  it("still gives unrelated outputs low confidence", () => {
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
  });
});

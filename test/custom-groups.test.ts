import { describe, expect, it } from "vitest";
import { analyze, detectAgreementSignal } from "../src";

describe("custom semantic groups", () => {
  it("marks the result method as heuristic", () => {
    const result = analyze({
      verbose: true,
      runs: ["The answer is stable.", "The answer is stable."]
    });

    expect(result.details?.method).toBe("heuristic");
  });

  it("uses custom groups as agreement signals", () => {
    expect(
      detectAgreementSignal(
        "The forecast mentions rain tomorrow.",
        "The forecast mentions showers tomorrow.",
        { rainTerms: ["rain", "showers", "precipitation"] }
      )
    ).toBe(true);
  });

  it("clusters custom vocabulary terms together", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The forecast mentions rain tomorrow.",
        "The forecast expects showers tomorrow.",
        "Precipitation is likely tomorrow."
      ],
      customGroups: {
        rainTerms: ["rain", "showers", "precipitation"]
      }
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
  });

  it("supports multi-word custom vocabulary terms", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The model is overfitting the examples.",
        "The model appears to be memorizing the examples.",
        "The model is not generalizing well."
      ],
      customGroups: {
        overfittingTerms: ["overfitting", "memorizing", "not generalizing"]
      }
    });

    expect(result.details?.clusters).toHaveLength(1);
    expect(result.details?.clusters[0]?.indexes).toEqual([0, 1, 2]);
  });
});


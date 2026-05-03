import { describe, expect, it } from "vitest";
import { analyze, detectAgreementSignal, detectDisagreement } from "../src";

describe("eligibility disagreement", () => {
  it("detects eligible vs not eligible", () => {
    expect(detectDisagreement("The customer is eligible.", "The customer is not eligible.")).toBe(true);
  });

  it("detects qualify vs not eligible", () => {
    expect(detectDisagreement("The customer may qualify.", "The customer is not eligible.")).toBe(true);
  });

  it("detects could qualify vs not eligible", () => {
    expect(detectDisagreement("The customer could qualify for a refund.", "The customer is not eligible for a refund.")).toBe(true);
  });

  it("detects eligible vs ineligible", () => {
    expect(detectDisagreement("The customer is eligible.", "The customer is ineligible.")).toBe(true);
  });

  it("treats positive eligibility terms as agreement signals", () => {
    expect(detectAgreementSignal("The customer is eligible.", "The customer could qualify.")).toBe(true);
    expect(detectAgreementSignal("The customer qualifies.", "The customer is qualified.")).toBe(true);
  });

  it("clusters positive refund eligibility runs and separates the negated run", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The customer is likely eligible for a refund.",
        "The customer may be eligible for a refund.",
        "The customer could qualify for a refund.",
        "The customer is not eligible for a refund."
      ]
    });

    expect(result.details?.clusters.map((cluster) => cluster.indexes)).toEqual([[0, 1, 2], [3]]);
    expect(result.outliers).toEqual(["The customer is not eligible for a refund."]);
    expect(
      result.details?.comparisons
        .filter((comparison) => comparison.rightIndex === 3)
        .map(({ leftIndex, rightIndex, disagrees }) => ({
          leftIndex,
          rightIndex,
          disagrees
        }))
    ).toEqual([
      { leftIndex: 0, rightIndex: 3, disagrees: true },
      { leftIndex: 1, rightIndex: 3, disagrees: true },
      { leftIndex: 2, rightIndex: 3, disagrees: true }
    ]);
  });
});


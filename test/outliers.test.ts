import { describe, expect, it } from "vitest";
import { analyze, detectOutliers } from "../src";

import type { PairwiseComparison } from "../src";

describe("detectOutliers", () => {
  it("flags eligible vs not eligible as meaning-level disagreement", () => {
    const runs = [
      "The customer is eligible for a refund.",
      "The customer qualifies for a refund.",
      "The customer is not eligible for a refund."
    ];
    const comparisons: PairwiseComparison[] = [
      { leftIndex: 0, rightIndex: 1, similarity: 0.71, disagrees: false },
      { leftIndex: 0, rightIndex: 2, similarity: 0.86, disagrees: false },
      { leftIndex: 1, rightIndex: 2, similarity: 0.63, disagrees: false }
    ];

    expect(detectOutliers(runs, comparisons)).toEqual([
      "The customer is not eligible for a refund."
    ]);
  });

  it("flags an isolated approved vs denied disagreement", () => {
    const result = analyze({
      verbose: true,
      runs: ["Refund approved", "Refund approved", "Refund denied"]
    });

    expect(result.outliers).toEqual(["Refund denied"]);
  });

  it("returns no outliers for similar password reset responses", () => {
    const result = analyze({
      verbose: true,
      runs: [
        "The user should reset their password.",
        "The user may need to reset their password.",
        "The user likely needs to reset their password.",
        "The best next step is resetting the password."
      ]
    });

    expect(result.outliers).toEqual([]);
  });

  it("returns no outliers when similar positive responses agree", () => {
    const runs = [
      "The customer is eligible for a refund.",
      "The customer qualifies for a refund.",
      "The customer can receive a refund."
    ];
    const comparisons: PairwiseComparison[] = [
      { leftIndex: 0, rightIndex: 1, similarity: 0.71, disagrees: false },
      { leftIndex: 0, rightIndex: 2, similarity: 0.5, disagrees: false },
      { leftIndex: 1, rightIndex: 2, similarity: 0.33, disagrees: false }
    ];

    expect(detectOutliers(runs, comparisons)).toEqual([]);
  });

  it("still flags low-similarity responses", () => {
    const runs = [
      "The customer is eligible for a refund.",
      "The customer qualifies for a refund.",
      "The customer can receive a refund.",
      "The package was delivered yesterday."
    ];
    const comparisons: PairwiseComparison[] = [
      { leftIndex: 0, rightIndex: 1, similarity: 0.71, disagrees: false },
      { leftIndex: 0, rightIndex: 2, similarity: 0.5, disagrees: false },
      { leftIndex: 0, rightIndex: 3, similarity: 0.09, disagrees: false },
      { leftIndex: 1, rightIndex: 2, similarity: 0.33, disagrees: false },
      { leftIndex: 1, rightIndex: 3, similarity: 0.1, disagrees: false },
      { leftIndex: 2, rightIndex: 3, similarity: 0.1, disagrees: false }
    ];

    expect(detectOutliers(runs, comparisons)).toEqual([
      "The package was delivered yesterday."
    ]);
  });
});

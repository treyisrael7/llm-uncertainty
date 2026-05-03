import { describe, expect, it } from "vitest";
import { findUnstablePhrases } from "../src";

describe("findUnstablePhrases", () => {
  it("returns unique unstable phrase matches with counts and run indexes", () => {
    const result = findUnstablePhrases([
      "The answer might be correct, but it may need review.",
      "It may be roughly correct and possibly incomplete.",
      "This result is clear."
    ]);

    expect(result).toEqual([
      { phrase: "might", count: 1, runs: [0] },
      { phrase: "may", count: 2, runs: [0, 1] },
      { phrase: "possibly", count: 1, runs: [1] },
      { phrase: "roughly", count: 1, runs: [1] }
    ]);
  });

  it("matches phrases case-insensitively and avoids partial word matches", () => {
    const result = findUnstablePhrases([
      "This is UNLIKELY, but likely still possible.",
      "The email says maybe, which should not count."
    ]);

    expect(result).toEqual([
      { phrase: "likely", count: 1, runs: [0] },
      { phrase: "unlikely", count: 1, runs: [0] }
    ]);
  });

  it("returns an empty array when no unstable phrases are present", () => {
    expect(findUnstablePhrases(["The answer is final."])).toEqual([]);
  });
});


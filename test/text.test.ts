import { describe, expect, it } from "vitest";
import { jaccardSimilarity, normalizeText, tokenize } from "../src";

describe("text utilities", () => {
  describe("normalizeText", () => {
    it("lowercases text, removes punctuation, normalizes whitespace, and trims", () => {
      expect(normalizeText("  Hello, WORLD!!!\nThis\tis fine.  ")).toBe(
        "hello world this is fine"
      );
    });
  });

  describe("tokenize", () => {
    it("returns meaningful word tokens", () => {
      expect(tokenize("Refund? The customer may qualify.")).toEqual([
        "refund",
        "the",
        "customer",
        "may",
        "qualify"
      ]);
    });

    it("returns an empty array for punctuation-only input", () => {
      expect(tokenize("... !!!")).toEqual([]);
    });
  });

  describe("jaccardSimilarity", () => {
    it("returns 1 for equivalent token sets", () => {
      expect(jaccardSimilarity("Hello, world!", "world hello")).toBe(1);
    });

    it("returns token overlap divided by token union", () => {
      expect(jaccardSimilarity("alpha beta", "beta gamma")).toBe(1 / 3);
    });

    it("returns 0 when only one input has tokens", () => {
      expect(jaccardSimilarity("alpha", "...")).toBe(0);
    });

    it("returns 1 when both inputs are empty after tokenization", () => {
      expect(jaccardSimilarity("...", " ")).toBe(1);
    });
  });
});
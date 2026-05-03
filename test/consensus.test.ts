import { describe, expect, it } from "vitest";
import { extractConsensus } from "../src";

describe("extractConsensus", () => {
  it("extracts a reasonable consensus from similar runs", () => {
    const consensus = extractConsensus([
      "The customer is likely eligible for a refund.",
      "The customer may be eligible for a refund.",
      "The customer could qualify for a refund."
    ]);

    expect(consensus).toBe("the customer is eligible for a refund");
  });

  it("falls back to the shortest run when outputs are very different", () => {
    const consensus = extractConsensus([
      "The customer is eligible for a refund.",
      "A rocket launched from the coast.",
      "Soup is ready."
    ]);

    expect(consensus).toBe("Soup is ready.");
  });
});

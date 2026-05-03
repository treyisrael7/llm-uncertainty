import { analyze } from "../src";

const result = analyze({
  verbose: true,
  runs: [
    "The customer is likely eligible for a refund because the item arrived damaged.",
    "The customer may be eligible for a refund since the item was damaged.",
    "The customer could qualify for a refund because the item arrived broken.",
    "The customer is not eligible for a refund because the item was used."
  ]
});

console.log("Verbose analysis");
console.log("----------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Variance: ${result.variance}`);
console.log(`Consensus: ${result.consensus}`);
console.log("Outliers:", result.outliers);
console.log("Method:", result.details?.method);
console.log("Unstable phrases:", result.details?.unstablePhrases);
console.log("Clusters:", result.details?.clusters);
console.log("Pairwise comparisons:", result.details?.comparisons);
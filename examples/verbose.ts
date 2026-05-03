import { analyze } from "../src";

const sampledAnswers = [
  "Approve the refund because the item arrived damaged.",
  "Approve the refund because the product arrived damaged.",
  "Approve the refund because the order arrived damaged.",
  "Do not approve the refund because the item was used."
];

const result = analyze({
  verbose: true,
  runs: sampledAnswers
});

console.log("Debug an unstable prompt");
console.log("------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Variance: ${result.variance}`);
console.log(`Consensus: ${result.consensus}`);
console.log("Outliers:", result.outliers);
console.log("Method:", result.details?.method);
console.log("Unstable phrases:", result.details?.unstablePhrases);
console.log("Clusters:", result.details?.clusters);
console.log("Pairwise comparisons:", result.details?.comparisons);
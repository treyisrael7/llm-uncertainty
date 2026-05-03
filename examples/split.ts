import { analyze } from "../src";

const result = analyze({
  verbose: true,
  runs: [
    "The customer is eligible for a refund because the item arrived damaged.",
    "The customer may qualify for a refund because the product arrived damaged.",
    "The customer is not eligible for a refund because the item was used.",
    "The customer does not qualify for a refund because the product was used."
  ]
});

console.log("Competing interpretations");
console.log("-------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
console.log("Disagreements:", result.details?.comparisons.filter((comparison) => comparison.disagrees));
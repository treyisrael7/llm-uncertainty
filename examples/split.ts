import { analyze } from "../src";

const result = analyze({
  verbose: true,
  runs: [
    "The stock will increase tomorrow.",
    "The stock may rise tomorrow.",
    "The stock will decrease tomorrow.",
    "The stock may fall tomorrow."
  ]
});

console.log("Competing interpretations");
console.log("-------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
console.log("Disagreements:", result.details?.comparisons.filter((comparison) => comparison.disagrees));
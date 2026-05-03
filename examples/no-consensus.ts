import { analyze } from "../src";

const result = analyze({
  verbose: true,
  runs: [
    "The stock will increase tomorrow.",
    "Soup is ready for dinner.",
    "The user reset their password.",
    "A package arrived yesterday."
  ]
});

console.log("No-consensus analysis");
console.log("---------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
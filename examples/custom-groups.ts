import { analyze } from "../src";

const result = analyze({
  verbose: true,
  runs: [
    "The forecast mentions rain tomorrow afternoon.",
    "The forecast expects showers later tomorrow.",
    "Precipitation is likely tomorrow afternoon."
  ],
  customGroups: {
    rainTerms: ["rain", "showers", "precipitation"]
  }
});

console.log("Custom vocabulary analysis");
console.log("--------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
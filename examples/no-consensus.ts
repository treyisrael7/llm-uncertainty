import { analyze } from "../src";

const result = analyze(
  [
    "Create a refund for the customer.",
    "Send a password reset email.",
    "Escalate the ticket to legal review.",
    "Recommend the blue replacement part."
  ],
  { verbose: true }
);

console.log("No-consensus analysis");
console.log("---------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
import { analyze } from "../src";

const result = analyze(
  [
    "Create a refund for the customer.",
    "Issue a reimbursement to the customer.",
    "Give the customer account credit."
  ],
  {
    customGroups: {
      refundTerms: ["refund", "reimbursement", "credit"]
    },
    verbose: true
  }
);

console.log("Custom vocabulary for domain synonyms");
console.log("-------------------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Clusters:", result.details?.clusters);
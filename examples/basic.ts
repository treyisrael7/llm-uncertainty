import { analyze } from "../src";

const sampledAnswers = [
  "Approve the refund because the item arrived damaged.",
  "Approve the refund because the product arrived damaged.",
  "Approve the refund because the order arrived damaged."
];

const result = analyze(sampledAnswers);

console.log("Basic LLM consistency check");
console.log("---------------------------");
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log("Outliers:", result.outliers);
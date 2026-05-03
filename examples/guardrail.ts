import { analyze } from "../src";

const prompt = "Should this support ticket receive an automatic refund?";
const sampledAnswers = [
  "Approve the refund because the item arrived damaged.",
  "Approve the refund because the product arrived damaged.",
  "Approve the refund because the order arrived damaged.",
  "Do not approve the refund because the item was used."
];

const result = analyze({
  runs: sampledAnswers
});

if (result.status !== "stable") {
  console.log("Route to review");
  console.log("---------------");
  console.log(`Prompt: ${prompt}`);
  console.log(`Status: ${result.status}`);
  console.log(`Confidence: ${result.confidence}`);
  console.log("Outliers:", result.outliers);
} else {
  console.log("Safe to automate:", sampledAnswers[0]);
}
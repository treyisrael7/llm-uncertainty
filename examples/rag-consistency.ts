import { analyze } from "../src";

const question = "What is the warranty period for the Pro Plan?";
const ragAnswers = [
  "The Pro Plan includes a one-year warranty.",
  "The Pro Plan has a 12-month warranty.",
  "Customers on the Pro Plan get a one-year warranty.",
  "The Pro Plan includes a two-year warranty."
];

const result = analyze(ragAnswers, {
  verbose: true
});

console.log("RAG consistency guardrail");
console.log("-------------------------");
console.log(`Question: ${question}`);
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Consensus: ${result.consensus}`);
console.log(`Why it matters: ${result.explanation}`);

if (result.status === "stable") {
  console.log("Action: answer the user with the consensus.");
} else {
  console.log("Action: re-check retrieved documents before answering.");
  console.log("Outliers:", result.outliers);
}

import { analyze } from "../src";

const ticket = "Customer says the headphones arrived broken and asks for a refund.";
const supportReplies = [
  "Approve the refund because the item arrived damaged.",
  "Approve the refund because the headphones arrived broken.",
  "Approve the refund because the product was damaged in delivery.",
  "Deny the refund because the customer changed their mind."
];

const result = analyze(supportReplies, {
  verbose: true
});

console.log("Customer support guardrail");
console.log("--------------------------");
console.log(`Ticket: ${ticket}`);
console.log(`Status: ${result.status}`);
console.log(`Confidence: ${result.confidence}`);
console.log(`Why it matters: ${result.explanation}`);
console.log("Outliers:", result.outliers);

if (result.status !== "stable") {
  console.log("Action: send this ticket to a human before replying.");
} else {
  console.log("Action: safe to use the majority answer.");
}

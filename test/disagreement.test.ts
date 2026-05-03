import { describe, expect, it } from "vitest";
import { detectAgreementSignal, detectDisagreement } from "../src";

describe("detectDisagreement", () => {
  it("detects eligible vs not eligible disagreement", () => {
    expect(detectDisagreement(
      "The customer is eligible for a refund.",
      "The customer is not eligible for a refund."
    )).toBe(true);
  });

  it("detects approved vs not approved disagreement", () => {
    expect(detectDisagreement("Refund approved", "Refund not approved")).toBe(true);
  });

  it("detects approved vs denied disagreement", () => {
    expect(detectDisagreement("Refund approved", "Refund denied")).toBe(true);
  });

  it("detects approved vs declined disagreement", () => {
    expect(detectDisagreement("Refund approved", "Refund declined")).toBe(true);
  });

  it("detects increase vs decrease disagreement", () => {
    expect(detectDisagreement("The stock will increase", "The stock will decrease")).toBe(true);
  });

  it("detects accepted vs declined disagreement", () => {
    expect(detectDisagreement("The application was accepted", "The application was declined")).toBe(true);
  });

  it("returns false for same-group positive outcomes", () => {
    expect(detectDisagreement("Refund approved", "Refund accepted")).toBe(false);
  });
});

describe("detectAgreementSignal", () => {
  it("detects positive outcome agreement", () => {
    expect(detectAgreementSignal("Refund approved", "Refund accepted")).toBe(true);
    expect(detectAgreementSignal("Payment was successful", "Payment went through")).toBe(true);
  });

  it("detects negative outcome agreement", () => {
    expect(detectAgreementSignal("Refund denied", "Refund rejected")).toBe(true);
  });

  it("detects upward movement agreement", () => {
    expect(detectAgreementSignal("The stock will increase", "The stock may rise")).toBe(true);
  });

  it("detects downward movement agreement", () => {
    expect(detectAgreementSignal("The stock will decrease", "The stock may fall")).toBe(true);
  });
});

import { normalizeText } from "./text";

import type { CustomGroups } from "./types";

const POSITIVE_OUTCOME_TERMS = [
  "approved",
  "approve",
  "accepted",
  "accept",
  "successful",
  "success",
  "went through",
  "processed"
] as const;

const NEGATIVE_OUTCOME_TERMS = [
  "denied",
  "deny",
  "declined",
  "decline",
  "rejected",
  "reject",
  "failed",
  "failure"
] as const;

const UPWARD_MOVEMENT_TERMS = [
  "increase",
  "increases",
  "increased",
  "rise",
  "rises",
  "rose"
] as const;

const DOWNWARD_MOVEMENT_TERMS = [
  "decrease",
  "decreases",
  "decreased",
  "fall",
  "falls",
  "fell"
] as const;

const ELIGIBILITY_TERMS = [
  "eligible",
  "eligibility",
  "qualify",
  "qualifies",
  "qualified"
] as const;

const SEMANTIC_GROUPS = [
  POSITIVE_OUTCOME_TERMS,
  NEGATIVE_OUTCOME_TERMS,
  UPWARD_MOVEMENT_TERMS,
  DOWNWARD_MOVEMENT_TERMS
] as const;

const IMPORTANT_NEGATION_TERMS = [
  "approved",
  "approve",
  "accepted",
  "accept",
  "processed",
  "successful",
  "success",
  "increase",
  "decrease",
  "rise",
  "fall"
] as const;

const OPPOSITE_PAIRS = [
  ["approve", "deny"],
  ["approve", "decline"],
  ["approved", "denied"],
  ["approved", "declined"],
  ["accepted", "declined"],
  ["increase", "decrease"],
  ["rise", "fall"],
  ["eligible", "ineligible"],
  ["qualify", "ineligible"],
  ["qualifies", "ineligible"],
  ["qualified", "ineligible"],
  ["success", "failure"],
  ["successful", "failed"],
  ["pass", "fail"],
  ["true", "false"],
  ["yes", "no"]
] as const;

export function detectDisagreement(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);

  return (
    hasOppositePair(left, right) ||
    hasOpposingSemanticGroups(left, right) ||
    hasEligibilityConflict(left, right) ||
    hasNegationMismatch(left, right)
  );
}

export function detectAgreementSignal(
  a: string,
  b: string,
  customGroups: CustomGroups = {}
): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);

  return (
    (hasPositiveEligibility(left) && hasPositiveEligibility(right)) ||
    SEMANTIC_GROUPS.some((group) =>
      hasAnyTerm(left, group) && hasAnyTerm(right, group)
    ) ||
    Object.values(customGroups).some((group) =>
      hasAnyTerm(left, normalizeCustomGroup(group)) &&
      hasAnyTerm(right, normalizeCustomGroup(group))
    )
  );
}

function hasOppositePair(left: string, right: string): boolean {
  return OPPOSITE_PAIRS.some(([positive, negative]) =>
    (hasTerm(left, positive) && hasTerm(right, negative)) ||
    (hasTerm(left, negative) && hasTerm(right, positive))
  );
}

function hasOpposingSemanticGroups(left: string, right: string): boolean {
  return (
    hasGroupConflict(left, right, POSITIVE_OUTCOME_TERMS, NEGATIVE_OUTCOME_TERMS) ||
    hasGroupConflict(left, right, UPWARD_MOVEMENT_TERMS, DOWNWARD_MOVEMENT_TERMS)
  );
}

function hasEligibilityConflict(left: string, right: string): boolean {
  return (
    (hasPositiveEligibility(left) && hasNegativeEligibility(right)) ||
    (hasNegativeEligibility(left) && hasPositiveEligibility(right))
  );
}

function hasPositiveEligibility(text: string): boolean {
  return ELIGIBILITY_TERMS.some((term) =>
    hasTerm(text, term) && !hasNegatedTerm(text, term)
  );
}

function hasNegativeEligibility(text: string): boolean {
  return hasTerm(text, "ineligible") ||
    ELIGIBILITY_TERMS.some((term) => hasNegatedTerm(text, term));
}

function hasGroupConflict(
  left: string,
  right: string,
  firstGroup: readonly string[],
  secondGroup: readonly string[]
): boolean {
  return (
    (hasAnyTerm(left, firstGroup) && hasAnyTerm(right, secondGroup)) ||
    (hasAnyTerm(left, secondGroup) && hasAnyTerm(right, firstGroup))
  );
}

function hasNegationMismatch(left: string, right: string): boolean {
  return IMPORTANT_NEGATION_TERMS.some((term) => {
    const leftHasTerm = hasTerm(left, term);
    const rightHasTerm = hasTerm(right, term);

    if (!leftHasTerm || !rightHasTerm) {
      return false;
    }

    return hasNegatedTerm(left, term) !== hasNegatedTerm(right, term);
  });
}

function hasAnyTerm(text: string, terms: readonly string[]): boolean {
  return terms.some((term) => hasTerm(text, term));
}

function normalizeCustomGroup(group: string[]): string[] {
  return group.map((term) => normalizeText(term)).filter(Boolean);
}

function hasTerm(text: string, term: string): boolean {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, "u").test(text);
}

function hasNegatedTerm(text: string, term: string): boolean {
  return new RegExp(
    `\\b(?:(?:does|do|can)\\s+not|(?:doesn|don|can)\\s+t|not|no|never|none|cannot)\\b(?:\\s+\\w+){0,2}\\s+${escapeRegExp(term)}\\b`,
    "u"
  ).test(text);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
# Invariants

This document defines the **non-negotiable invariants** of **apiscope**.

These invariants are treated as **constraints**, not suggestions.

If a feature violates any invariant, it must not ship — regardless of
usefulness, convenience, or perceived value.

---

## Core Invariant

**Every output must communicate uncertainty, context, and non-authority.**

This invariant applies to:

- reports
- CLI output
- logs
- documentation
- examples
- future extensions

If any output asserts truth, intent, correctness, or blame **without evidence
and context**, it violates the project’s purpose.

---

## Observational, Not Authoritative

The system reports **observed behavior**, not contracts.

Observations are evidence — not conclusions.

The tool does not decide what is “correct.”

### Disallowed Patterns

- “This endpoint violates the spec”
- “This field should not exist”
- “This behavior is incorrect”

### Allowed Patterns

- “This field was observed in 18% of samples”
- “Observed behavior differs from documented schema”
- “This variance may impact clients”

---

## Explicit Context Is Mandatory

All findings must include sufficient context to be interpreted safely.

At minimum, this includes:

- observation window
- sample count
- scope of aggregation
- confidence indicators

Silence or context-free output is treated as a failure.

---

## Uncertainty Must Be Visible

Uncertainty is not an implementation detail — it is a **first-class output**.

- Confidence is expressed qualitatively or descriptively
- Assumptions are surfaced, not hidden
- Sampling limitations are acknowledged when relevant

The system must prefer **honest ambiguity** over false precision.

---

## Conservative Defaults

Defaults are intentionally restrained.

- Show only high-severity, high-confidence findings by default
- Avoid overwhelming users with low-impact observations
- Additional detail must be opt-in

Respect for human attention is a core design constraint.

---

## No Speculation About Cause

The system must not attribute observed behavior to:

- code changes
- deploys
- feature flags
- ownership
- intent

It reports **what changed and when**, not **why**.

Any feature implying causal explanation violates this invariant.

---

## No Enforcement, No Blame

This tool is not an enforcement mechanism.

It does not:

- block deploys
- mark compliance
- assign fault

Language, severity labels, and output structure must avoid blame framing.

---

## Silence Is Not Success

When no significant drift is detected, the system must emit an **affirmative
confirmation** indicating:

- that observation occurred
- what window was analyzed
- what volume of data was considered

Quiet success must still be visible.

---

## Stability Over Feature Momentum

New features must preserve the project’s epistemic posture.

Features that:

- sharpen language
- increase perceived authority
- optimize for completeness over trust

are considered regressions unless they explicitly reinforce the core invariant.

---

## Enforcement

These invariants are enforced through:

- code review
- output review
- documentation review

Where feasible, invariants should also be enforced through **automated checks**
(e.g., snapshot tests on output language and structure).

If an invariant is unclear in practice, it must be clarified here **before**
implementation proceeds.

---

## Final Note

These invariants exist to protect the **long-term trustworthiness** of the
system — including from its future maintainers.

They are intentionally conservative.

That conservatism **is the product**.

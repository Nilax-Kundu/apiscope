# Longitudinal Design Invariants (V2)

This document defines the invariants introduced with V2, which extends
ObservedAPIdrift from single-run diagnostics to longitudinal observation
across multiple runs.

All V1 invariants remain in full force.

If any V2 feature violates either the V1 invariants or the rules defined
below, it must not ship.

---

## Core Invariant

**Temporal insight must not be mistaken for causal insight.**

V2 introduces history, comparison across runs, and trend awareness.
It does **not** introduce explanations of why changes occurred.

Time adds context — **not authority**.

---

## Observation Over Time, Not Explanation

V2 may report that observed behavior changed between runs.

V2 may report when a change first appeared, stabilized, or disappeared.

V2 must not infer cause, intent, or responsibility from temporal proximity.

### Disallowed Patterns

- “This change was likely caused by a deployment”
- “This regression occurred after feature X”
- “This drift correlates with commit Y”

### Allowed Patterns

- “This field’s observed frequency increased from 18% to 82%”
- “This variance stabilized over the last 5 runs”
- “This behavior has not been observed since the previous window”

---

## Report-to-Report Diff Is Evidence, Not Verdict

Differences between reports are treated as **change events**, not judgments.

- A newly appearing finding is not inherently a regression
- A disappearing finding is not inherently a fix
- A severity change reflects data, not impact

Language and structure must preserve this neutrality.

---

## Stability Is Earned, Not Assumed

V2 may classify behavior as stable or benign **only when supported by
sustained evidence across runs**.

- One-time or short-lived behavior must not be normalized
- Stability is descriptive, not normative
- “Benign drift” does not mean “acceptable” — only “consistently observed”

---

## Suppression Must Be Reversible and Evidenced

V2 may suppress findings from default output **only** when:

- suppression criteria are explicit
- evidence thresholds are met
- suppressed findings remain stored and diffed

Suppression is a **presentation choice**, not deletion.

Silent suppression violates the project’s trust model.

---

## Confidence Must Evolve With Time

Confidence in V2 must account for both **recency** and **volatility**.

- Older observations lose weight
- Stale certainty must decay
- Long-term stability must be distinguishable from lack of recent data

V2 must never present outdated confidence as current truth.

---

## Longitudinal Silence Must Remain Visible

When multiple consecutive runs show no significant change:

- the system must affirm continuity
- the system must indicate comparison occurred
- silence must be contextualized over time

“Nothing changed” is a meaningful outcome and must be stated as such.

---

## Backward Compatibility Is a Trust Constraint

V2 must not invalidate or reinterpret V1 reports.

- V1 reports remain truthful within their original observation window
- V2 adds context; it does not rewrite history
- Historical outputs must not be reframed with new semantics

Trust depends on temporal consistency.

---

## No Retrospective Authority

V2 must not reinterpret past observations using new rules in a way that:

- sharpens conclusions
- introduces judgment
- assigns meaning that did not exist at the time

Historical data is evidence, not an opportunity for hindsight certainty.

---

## Enforcement

These invariants are enforced through:

- architectural review of new components
- report diff inspection
- snapshot tests on longitudinal output
- documentation review

Any feature that requires exceptions to these rules must first amend
this document.

---

## Final Note

V2 increases **context**, not **confidence**.

It is designed to make change visible without turning time into blame,
explanation, or authority.

If V1 protects the system from **false precision**,  
V2 protects it from **false narrative**.

That protection is intentional.

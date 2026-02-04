# **apiscope** — V3 Implementation Walkthrough

This document explains how **apiscope** V3 is structured and why its
implementation choices matter.

V3 introduces **safe usability improvements** — features that increase
readability and navigability of evidence **without adding interpretation,
judgment, or authority**.

All V1 and V2 behavior remains unchanged.

---

## Design Goal

V3 exists to answer one question only:

> How can humans see the evidence more clearly without the system deciding what it means?

Every V3 feature was evaluated against a single test:

**Does this clarify evidence, or does it replace human judgment?**

Only the first category was allowed.

---

## Presentation Layer Overview

V3 introduces a dedicated **presentation layer** under `src/presentation/`.

This layer:
- transforms data **without interpretation**
- does not add conclusions, scores, or recommendations
- never alters underlying observations

All modules are pure functions.

```text
src/presentation/
├── density-filter.ts  // progressive disclosure
├── grouping.ts        // structural organization
├── trend-viz.ts       // ASCII trend visualization
├── annotations.ts     // static design notes
├── delta-summary.ts   // quantitative change counts
├── footer.ts          // explicit non-goals
└── exporters.ts       // output formatting
```

---

## Module Walkthrough

### 1. Evidence Density Control

**File:** [`src/presentation/density-filter.ts`](src/presentation/density-filter.ts)

Purpose: reduce scanning cost without suppressing evidence.

- `--verbose` shows all findings (default)
- `--compact` shows only high-severity, high-sample findings
- Hidden findings are counted and disclosed (`Showing N of M`)

Key constraint:
- compact mode must feel *less dense*, not *better*

No prioritization language is introduced.

---

### 2. Structural Grouping

**File:** [`src/presentation/grouping.ts`](src/presentation/grouping.ts)

Purpose: reduce cognitive load by organizing findings structurally.

Supported groupings:
- endpoint (`GET /users`)
- field path
- status code
- none

Grouping is deterministic and non-prioritizing.
Sort order within groups is unchanged.

---

### 3. Temporal Micro-Visualization

**File:** [`src/presentation/trend-viz.ts`](src/presentation/trend-viz.ts)

Purpose: show frequency shape over time without numerical overconfidence.

- Uses ASCII blocks (`▁▂▃▄▅▆▇█`)
- Describes trends as:
  - increasing
  - decreasing
  - stable
  - insufficient history

Strict language constraints:
- no adjectives
- no urgency
- no implied directionality

If the description could appear in a postmortem slide, it is too strong.

---

### 4. Inline Design Annotations

**File:** [`src/presentation/annotations.ts`](src/presentation/annotations.ts)

Purpose: explain *why* certain features do not exist.

Examples:
- confidence inputs are not scores
- severity reflects data patterns, not impact
- trends describe shape, not cause

These notes reduce confusion without adding interpretation.

---

### 5. Run-to-Run Delta Summary

**File:** [`src/presentation/delta-summary.ts`](src/presentation/delta-summary.ts)

Purpose: make change visibility explicit.

Produces purely quantitative summaries:
- findings appeared
- findings disappeared
- severity shifts
- frequency shifts

If no changes occurred, this is stated explicitly.

No judgment is implied.

---

### 6. Explicit Non-Goals Footer

**File:** [`src/presentation/footer.ts`](src/presentation/footer.ts)

Purpose: reinforce epistemic boundaries at the moment of consumption.

The footer states clearly that the report:
- does not infer causality
- does not assign ownership
- does not assess impact

This reduces misuse by setting expectations up front.

---

### 7. Export Formats

**File:** [`src/presentation/exporters.ts`](src/presentation/exporters.ts)

Purpose: support integration without transformation.

Supported formats:
- `json`
- `json-pretty`
- `ndjson`

No summarization or rewriting occurs during export.

---

## CLI Integration

V3 is opt-in and requires V2.

```bash
--v3                    # enable presentation layer
--compact               # reduced density view
--group-by <dimension>  # endpoint | field | status | none
--format <format>       # json | json-pretty | ndjson
```

Output streams are intentionally separated:

- **stdout:** machine-readable JSON
- **stderr:** human-readable context (summaries, footers)

This preserves scriptability.

---

## Invariant Compliance

All V3 features were audited against project invariants.

### Density Language
- **allowed:** “Showing N of M”
- **forbidden:** “most important”, “critical”, “recommended”

### Trend Language
- **allowed:** “increasing”, “stable”
- **forbidden:** “worsening”, “concerning”, “dramatic”

Language vigilance tests enforce this mechanically.

---

## Testing Status

All V3 modules are unit-tested.

- [x] density filter tests
- [x] trend visualization tests
- [x] delta summary tests
- [x] language vigilance tests

All existing V1 and V2 tests continue to pass.

---

## Backward Compatibility

- ✅ V1 behavior unchanged
- ✅ V2 behavior unchanged
- ✅ V3 features are additive and opt-in
- ✅ No reinterpretation of historical data

---

## Status

V3 completes the intended scope of **apiscope**.

No further features are planned unless they:

1. improve visibility without interpretation
2. reinforce uncertainty instead of hiding it
3. reduce misuse rather than enable it

The system is intentionally complete.

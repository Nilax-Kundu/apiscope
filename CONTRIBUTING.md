# Contributing to **apiscope**

Contributions are welcome — provided they respect the project’s
non-negotiable design constraints.

**apiscope** is intentionally conservative.
Not all “useful” features are acceptable.

Please read this document before opening a pull request.

---

## Core Rule

If a contribution violates the project’s invariants, it will not be merged —
regardless of technical quality or usefulness.

Design constraints are documented in:

- `REFUSALS.md`
- `docs/INVARIANTS.md`

These documents have higher priority than feature requests.

---

## What Contributions Are Welcome

✅ Bug fixes  
✅ Performance improvements  
✅ Test coverage improvements  
✅ Documentation clarity  
✅ Refactors that preserve behavior  
✅ New features that **only improve evidence visibility**, not interpretation  

Examples:
- better grouping
- clearer formatting
- additional context fields
- improved sampling transparency

---

## What Will Be Rejected

❌ Causal explanations (“why this happened”)  
❌ Blame or ownership attribution  
❌ Enforcement or blocking behavior  
❌ Recommendations or fixes  
❌ Impact scoring or prioritization  
❌ Narrative summaries  
❌ Claims of completeness or correctness  

If a feature makes the system sound more confident than the data supports,
it violates the project’s purpose.

---

## Pull Request Expectations

All PRs must:

- preserve existing output semantics
- include tests where applicable
- avoid authoritative or judgmental language
- maintain backward compatibility (V1 and V2)

PRs that require weakening invariants must first propose changes to the
invariant documents themselves.

---

## Philosophy Matters Here

**apiscope** is designed to be **hard to misuse**.

If a contribution makes it easier to:
- assign blame
- win arguments
- outsource judgment

…it is almost certainly out of scope.

Thank you for respecting that boundary.

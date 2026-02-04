# Design Retrospective — ObservedAPIdrift (V1 → V2)

## Context

ObservedAPIdrift was built to explore a recurring tension in backend and
platform systems:

**How do we surface useful insight from production behavior without turning
tools into sources of authority, blame, or false certainty?**

The project began as a single-run diagnostic tool (V1) and evolved into a
longitudinal observation system (V2). Across both phases, the primary design
challenge was not technical complexity, but **epistemic discipline**: deciding
what the system is allowed to claim.

This retrospective documents the key design decisions, constraints, and
refusals that shaped the system.

---

## Core Design Philosophy

From the beginning, the system was constrained by one guiding principle:

**Report observed evidence, not truth, intent, or causality.**

Everything else — architecture, data models, defaults, and presentation —
flows from this.

The system is intentionally:

- observational, not authoritative  
- descriptive, not prescriptive  
- conservative in defaults  
- explicit about uncertainty  

These outcomes were not accidental. They were enforced structurally.

---

## Major Design Decisions

### 1. Bottom-Up, “Boring-First” Architecture

The system was built bottom-up:

1. traffic ingestion  
2. observation modeling  
3. comparison logic  
4. report construction  
5. presentation filtering  

This avoided a common failure mode where conclusions are designed first and
evidence is shaped to fit them.

The result is a system where:

- evidence exists independently of interpretation  
- higher layers cannot fabricate meaning  
- future extensions must respect lower-level truth  

---

### 2. Pure Data Models as Guardrails

All core domain types are pure data structures, with no embedded behavior or
interpretation.

This choice:

- prevents accidental authority creep  
- makes invariants mechanically enforceable  
- keeps AI, prose, or UI layers optional and replaceable  

If meaning must be added, it must happen outside the data.

---

### 3. Explicit Context Everywhere

Every finding includes explicit context:

- time window  
- sample counts  
- frequency percentages  
- confidence inputs (not scores)  

Silence is never ambiguous.

This design was chosen because systems that hide context often gain perceived
authority while losing trust.

---

### 4. Affirmative Empty States

“Nothing happened” is treated as a first-class outcome.

Both V1 and V2 explicitly emit confirmations such as:

> “No high-severity, high-confidence drift observed across the last N runs.”

This avoids:

- the “is it working?” problem  
- ritual reruns  
- silent erosion of trust  

---

## Key V2 Evolution Decisions

### 5. History Without Narrative

V2 introduced memory, diffing, and trends — but not explanations.

The core invariant for V2 was:

**Temporal insight must not be mistaken for causal insight.**

As a result:

- reports are diffed, not reinterpreted  
- previous runs are referenced, not rewritten  
- changes are described as events, not regressions or fixes  

Time adds context, not authority.

---

### 6. Superset, Not Mutation

V2 wraps V1 instead of modifying it.

This ensures:

- V1 reports remain valid indefinitely  
- meaning does not shift retroactively  
- trust does not decay over time  

Historical evidence is never “upgraded” with hindsight.

---

### 7. Stability Is Earned, Not Assumed

The concept of “benign drift” exists in V2, but only as a presentation
classification earned through repeated observation.

A finding becoming “benign” does not:

- erase evidence  
- rewrite severity  
- imply acceptability  

It reflects consistency over time — nothing more.

---

## Design Pressures Explicitly Resisted

Several common feature requests were intentionally declined, even when
technically easy to add:

**“Why can’t it tell me who broke it?”**  
Because attribution introduces blame and speculation without sufficient
evidence.

**“Can’t it link to commits or deploys?”**  
Because temporal proximity is not causality, and implying otherwise erodes
trust.

**“Can it recommend fixes?”**  
Because recommendations require intent, impact, and ownership — none of which
the system can know.

**“Can it enforce the spec?”**  
Because enforcement converts evidence into authority.

Each of these would have increased short-term usefulness while damaging
long-term credibility.

They were treated as **feature traps**, not missing features.

---

## Sociotechnical Considerations

A recurring concern throughout design was misuse — not misuse as error, but
misuse as politics.

Tools that appear authoritative tend to be:

- copy-pasted into tickets  
- used to win arguments  
- treated as final truth  

To mitigate this:

- language avoids absolutes  
- data is presented with uncertainty  
- suppression is reversible and evidenced  
- invariants are explicit and documented  

The system is intentionally hard to weaponize.

---

## What This Project Is Not Trying to Be

ObservedAPIdrift is not:

- a linter  
- a contract enforcer  
- a root-cause engine  
- a decision system  
- a replacement for tests or reviews  

It is a **diagnostic observation tool** that helps humans reason more clearly
about reality — no more, no less.

---

## Lessons Learned

- Restraint is a feature, not a lack of ambition  
- Defaults matter more than capabilities  
- Silence must be designed, not assumed  
- History increases responsibility, not certainty  
- Good tools survive because they refuse to answer the wrong questions  

---

## Current Status

As of V2.0.0, the system is:

- feature complete for its intended scope  
- longitudinally stable  
- invariant-preserving  
- safe for pipeline and operational use  

Further development should begin not with *“what can we add?”* but with:

**What future pressure should this system permanently refuse?**

That question is now part of the design.

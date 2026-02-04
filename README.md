# apiscope

**apiscope** (formerly ObservedAPIdrift) is a diagnostic tool that compares
documented API behavior (OpenAPI specifications) with **observed runtime
behavior** derived from real traffic samples.

It reports **evidence of divergence**, not truth, intent, or correctness.

The goal is to help API maintainers understand how production behavior relates
to documentation — with explicit context, visible uncertainty, and deliberate
restraint.

---

## Problem Statement

In real systems, API documentation and runtime behavior often diverge:

- documentation lags behind production changes  
- behavior varies by parameters, time, or rollout strategy  
- legacy paths persist for backward compatibility  
- specifications encode intent, not reality  

Some divergence is inevitable — and in many cases, intentional.

Most existing tools fall into one of two camps:

- **spec-first tools** that enforce contracts without observing reality  
- **traffic observers** that surface data without explaining meaning  

**apiscope** sits between these extremes.

---

## Goals

### 1. Observe behavior, not assert correctness

The system builds an observed behavior model from runtime traffic and compares
it against a provided OpenAPI specification.

It does **not** decide what is correct.  
It reports what was observed, with evidence.

---

### 2. Surface drift with context and confidence

All findings include explicit context:

- observation time window  
- sample counts  
- observed variants  
- confidence indicators  

Uncertainty is surfaced, not hidden.

---

### 3. Prioritize attention, not exhaustiveness

By default, output focuses on:

- high-severity findings  
- high-confidence signals  
- recent observations  

Lower-impact observations remain available but are not forced into the default
view.

The tool is designed to respect limited human attention.

---

### 4. Support understanding, not enforcement

Outputs are phrased to:

- explain **what changed** and **when**  
- avoid attributing cause or blame  
- avoid authoritative or contractual language  

**apiscope** is a diagnostic assistant, not a policy engine.

---

### 5. Fail gracefully and affirm success

When no significant drift is detected, the tool emits an affirmative
confirmation indicating:

- the observation window  
- the volume of traffic analyzed  

Silence is avoided. Successful observation is acknowledged explicitly.

---

## What This Looks Like in Practice

Example output might report that a response field appears in **18% of samples**
over a **7-day window**, with **low confidence**, suggesting conditional or
client-specific behavior rather than a stable contract.

Findings are presented as **observations**, not conclusions.

---

## Non-Goals

This project intentionally does **not** attempt to:

### ✗ Infer intent  
Observed behavior is not assumed to represent design intent or contractual
guarantees.

### ✗ Enforce specifications  
The tool does not mark APIs as compliant or non-compliant and does not block
deploys or changes.

### ✗ Attribute root cause  
It does not explain *why* behavior changed or link drift to:

- code changes  
- deploys  
- feature flags  
- configuration  

Only *what changed* and *when* is reported.

### ✗ Automatically modify documentation  
Documentation updates may be suggested as diffs for human review.  
No automatic overwrites or commits are performed.

### ✗ Guarantee coverage or completeness  
Observed behavior depends on:

- traffic volume  
- client diversity  
- capture window  

Sampling bias is acknowledged and surfaced, not eliminated.

### ✗ Replace tests, reviews, or ownership  
**apiscope** complements existing engineering practices.  
It does not replace:

- contract tests  
- code review  
- architectural decisions  
- human judgment  

---

## Intended User

The primary audience is:

**API maintainers assessing whether documentation reasonably reflects observed
production behavior.**

Other roles — platform teams, client teams, on-call engineers — may benefit
incidentally, but the system is designed around this primary persona.

---

## Design Principle (Invariant)

**Every output must communicate uncertainty, context, and non-authority.**

If a feature cannot uphold this invariant, it does not ship.

This principle governs defaults, language, severity ranking, and all future
extensions.

See [REFUSALS.md](REFUSALS.md) and [docs/INVARIANTS.md](docs/INVARIANTS.md) for
the full design constraints.

---

## Getting Started

See [GETTING_STARTED.md](GETTING_STARTED.md) for installation instructions,
usage examples, and V1 / V2 / V3 mode explanations.

---

## Project Status

**apiscope** is intentionally complete.

The system reached its final design at **V3 (Safe Usability Frontier)**.
Further feature development would require revisiting core invariants around
interpretation, authority, and misuse.

The project is maintained for correctness and bug fixes only.

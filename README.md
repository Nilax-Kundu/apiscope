Observed API Drift

Observed API Drift is a diagnostic tool that compares documented API behavior with observed runtime behavior using real traffic samples.

It reports evidence of divergence, not truth or intent.

The goal is to help API maintainers understand how production behavior relates to documentation — with context, uncertainty, and restraint.

Problem Statement

In real systems, API documentation and runtime behavior often diverge:

documentation lags behind production changes

behavior varies by parameters, time, or rollout

legacy paths persist for compatibility

specs encode intent, not reality

Some divergence is inevitable and, in some cases, intentional.

Most tools either:

enforce specs without observing reality, or

observe traffic without explaining meaning

This tool sits in between.

Goals
1. Observe behavior, not assert correctness

The system builds an observed behavior model from runtime traffic and compares it against a provided OpenAPI specification.

It does not decide what is correct.
It reports what was observed, with evidence.

2. Surface drift with context and confidence

All findings include:

time window of observation

sample counts

observed variants

confidence indicators

Uncertainty is explicit, not hidden.

3. Prioritize attention, not exhaustiveness

By default, output focuses on:

high-severity

high-confidence

recent findings

Lower-impact observations remain available but are not forced into the default view.

The tool is designed to respect limited human attention.

4. Support understanding, not enforcement

Outputs are phrased to:

explain what changed and when

avoid attributing cause or blame

avoid authoritative or contractual language

The tool is a diagnostic assistant, not a policy engine.

5. Fail gracefully and affirm success

When no significant drift is detected, the tool emits a positive confirmation indicating:

the observation window

the volume of traffic analyzed

Silence is avoided; successful observation is acknowledged.

What This Looks Like in Practice

Example output might report that a response field appears in 18% of samples over a 7-day window, with low confidence, suggesting conditional or client-specific behavior rather than a stable contract.

Findings are presented as observations, not conclusions.

Non-Goals

This project intentionally does not attempt to:

✗ Infer intent

Observed behavior is not assumed to represent design intent or contractual guarantees.

✗ Enforce specifications

The tool does not mark APIs as compliant or non-compliant and does not block deploys or changes.

✗ Attribute root cause

It does not explain why behavior changed or link drift to:

code changes

deploys

feature flags

configuration

Only what changed and when is reported.

✗ Automatically modify documentation

Documentation updates are suggested as diffs for human review.
No automatic overwrites or commits are performed.

✗ Guarantee coverage or completeness

Observed behavior depends on:

traffic volume

client diversity

capture window

Sampling bias is acknowledged and surfaced, not eliminated.

✗ Replace tests, reviews, or ownership

This tool complements existing engineering practices.
It does not replace:

contract tests

code review

architectural decisions

human judgment

Intended User

The primary audience is:

API maintainers assessing whether documentation reasonably reflects observed production behavior.

Other roles (platform teams, client teams, on-call engineers) may benefit incidentally, but the system is designed around this primary persona.

Design Principle (Invariant)

Every output must communicate uncertainty, context, and non-authority.

If a feature cannot uphold this invariant, it does not ship.

This principle governs defaults, language, severity ranking, and future extensions.

Status

This project is intentionally scoped to a single service, JSON REST APIs, and read-only observation in its initial version.

Future work is constrained by the same philosophy:
clarity over completeness, trust over cleverness.
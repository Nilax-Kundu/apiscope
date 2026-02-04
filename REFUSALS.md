# Refusals

This document defines pressures that ObservedAPIdrift must **permanently refuse**.

Not because they are hard.  
Not because they are unethical.  
But because they collapse **evidence into authority** — and once that happens,
trust never fully recovers.

These refusals are structural, not negotiable.
If a feature violates any of them, it does not ship.

---

## 1. Causal Attribution

> “Can you tell us *why* this changed?”

This is the most dangerous pressure.

Time plus change creates an almost irresistible pull toward explanation:

- deploys  
- commits  
- feature flags  
- configuration changes  

The moment the system says:

> “This likely happened because…”

…it stops being an observation tool and becomes a story generator.

### Why this must be refused permanently

- temporal correlation is not causation  
- partial visibility guarantees incorrect attribution  
- incorrect attribution gets acted on with confidence  

Once a tool explains *why* even occasionally, users will treat it as
authoritative *all the time*.

ObservedAPIdrift must never cross this line.

---

## 2. Blame and Ownership

> “Which team owns this drift?”  
> “Can we route this to the right on-call?”

This is where diagnostic tools become weapons.

Ownership feels operationally reasonable, but it quietly transforms:

- observations into accusations  
- evidence into leverage  
- dashboards into arbitration tools  

### Why this must be refused

- ownership models are social, not technical  
- partial ownership is worse than no ownership  
- blame destroys adoption faster than noise  

A tool that can be used to win arguments **will** be used that way.

---

## 3. Enforcement

> “Can this block deploys?”  
> “Can we fail CI if drift is detected?”

This is the boundary between diagnostic and gatekeeper.

Once enforcement exists:

- findings become verdicts  
- uncertainty becomes unacceptable  
- edge cases turn into outages  

### Why this must be refused

- enforcement demands false precision  
- false positives become production incidents  
- epistemic humility disappears  

Enforcement requires authority.  
This system is explicitly designed **not to have any**.

---

## 4. Recommendations

> “What should we do about this?”  
> “Can it suggest fixes?”

This sounds helpful. It isn’t.

Recommendations require context the system cannot possess:

- intent  
- business risk  
- backward compatibility guarantees  
- client expectations  

### Why this must be refused

- recommendations imply responsibility  
- responsibility implies authority  
- authority implies trust the system cannot earn  

The moment a tool tells people what to do, it owns the outcome.

---

## 5. Impact Scoring

> “How bad is this?”  
> “What’s the client impact?”

Impact sounds measurable. It almost never is.

Real impact depends on:

- which clients  
- which usage paths  
- contractual guarantees  
- undocumented assumptions  

### Why this must be refused

- estimated impact becomes de facto truth  
- quantified uncertainty feels authoritative  
- prioritization gets outsourced to partial visibility  

This system can show **change**.  
It cannot show **consequence**.

---

## 6. Narrative Generation

> “Can you summarize what happened?”  
> “Give me a story for the incident report.”

This pressure is subtle — and deadly.

Narratives:

- compress ambiguity  
- remove uncertainty  
- feel complete even when wrong  

### Why this must be refused

- stories outlive evidence  
- stories get copy-pasted  
- stories harden into institutional memory  

ObservedAPIdrift outputs structured evidence, not stories.

Humans may write narratives — visibly, explicitly, and accountably.

---

## 7. Completeness Claims

> “Can it catch all drift?”  
> “Can we treat this as the source of truth?”

Completeness is a lie in observability.

### Why this must be refused

- sampling bias is irreducible  
- partial coverage is inevitable  
- claims of completeness create false safety  

The system must always feel **incomplete but honest**,  
never **complete but fragile**.

---

## 8. Normalization Without Evidence Decay

> “This keeps happening — can we just treat it as normal?”

This is how blind spots form.

Benign drift is allowed only because:

- evidence remains visible  
- suppression is reversible  
- nothing is erased  

### What must be refused

- permanent ignores  
- silent suppression  
- “don’t show this again” semantics  

Normalization without decay of evidence is how systems lie to themselves.

---

## The One-Sentence Rule

If this had to be written on the wall of the repository:

> **ObservedAPIdrift must never collapse evidence into judgment.**

Everything else follows from this.

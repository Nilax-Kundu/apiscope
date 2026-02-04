# DriftReport V2 — Extension Design

## Design Rule (Non-Negotiable)

V2 **extends** the report; it does not modify the meaning of any V1 fields.

A V1 report must remain valid, truthful, and interpretable on its own.

V2 adds **adjacent context**, not reinterpretation.

---

## High-Level Shape

V2 is a strict **superset** of V1.

```text
DriftReportV2
├─ report        // V1 DriftReport (unchanged)
├─ run           // metadata about this execution
├─ previousRun   // reference only (no data copying)
├─ changes[]     // report-to-report diffs
├─ trends[]      // confidence & stability over time
└─ continuity    // longitudinal empty / no-change signal
```

**Key idea:**  
Everything new lives **outside** the V1 report.

---

## 1. Embedded V1 Report (Frozen)

```typescript
interface DriftReportV2 {
  report: DriftReport;           // exact V1 structure
  run: RunMetadata;
  previousRun?: PreviousRunRef;
  changes: ChangeEvent[];
  trends: TrendSummary[];
  continuity?: ContinuitySignal;
}
```

You must be able to do:

```typescript
const v1 = v2.report;
```

…and nothing breaks.

This is intentional.

---

## 2. Run Metadata (Identity, Not Meaning)

```typescript
interface RunMetadata {
  runId: string;
  executedAt: string;       // ISO timestamp
  serviceName: string;
  environment: string;
  specHash: string;
  toolVersion: string;
}
```

**Rules:**

- No conclusions
- No deltas
- No interpretation

This anchors time and provenance without adding meaning.

---

## 3. Previous Run Reference (No Hindsight)

```typescript
interface PreviousRunRef {
  runId: string;
  executedAt: string;
}
```

**Important constraints:**

- Do not inline or restate previous findings
- Only reference them

**Why:**

- Prevents retrospective reinterpretation
- Avoids authority creep through comparison language

---

## 4. Change Events

**What Changed — Not What It Means**  
This is the heart of V2.

### 4.1 ChangeEvent (Base)

```typescript
interface ChangeEvent {
  changeId: string;
  changeType:
    | "finding_appeared"
    | "finding_disappeared"
    | "severity_shift"
    | "frequency_shift"
    | "confidence_shift";
  scope: FindingScope;
  previous?: ChangeSnapshot;
  current?: ChangeSnapshot;
}
```

**Notice what is absent:**

- No “regression”
- No “fix”
- No “improvement”

Only change.

### 4.2 FindingScope

```typescript
interface FindingScope {
  method: string;
  path: string;
  fieldPath?: string;
  statusCode?: number;
}
```

Same scoping rules as V1.  
No new interpretation layer.

### 4.3 ChangeSnapshot (Pure Data)

```typescript
interface ChangeSnapshot {
  severity?: "high" | "medium" | "low" | "benign";
  frequencyPercentage?: number;
  sampleCount?: number;
  confidenceInputs?: ConfidenceInputs;
}
```

**Rules:**

- Snapshots are partial
- Only include what actually changed
- No derived meaning

---

## 5. Trend Summaries

**Earned Stability**  
Trends answer one question only:

> How has this behaved over multiple runs?

### 5.1 TrendSummary

```typescript
interface TrendSummary {
  scope: FindingScope;
  observationCount: number;      // number of runs
  frequencyBand: FrequencyBand;
  confidenceTrend: ConfidenceTrend;
  stability: "stable" | "volatile" | "emerging";
}
```

No “good / bad”.  
No “safe / unsafe”.

### 5.2 Supporting Enums

```typescript
type FrequencyBand =
  | "rare"
  | "intermittent"
  | "common"
  | "dominant";

type ConfidenceTrend =
  | "strengthening"
  | "weakening"
  | "stable"
  | "insufficient_data";
```

These describe shapes, not judgments.

---

## 6. Continuity Signal

**Longitudinal Silence**  
This solves the “silent success over time” problem.

```typescript
interface ContinuitySignal {
  comparedRuns: number;
  unchangedFindings: number;
  message: string;
}
```

Example message (generated, not inferred):

> “No high-severity or high-confidence changes detected across the last 4 runs.”

**Rules:**

- Continuity is explicit
- Silence is contextualized
- Still no authority

---

## 7. What V2 Does Not Add (By Design)

DriftReport V2 still does **not** contain:

- causal explanations
- ownership information
- deployment references
- commit hashes
- recommendations

If someone asks “why isn’t this here?”  
The answer is `INVARIANTS.md`.

---

## 8. Mechanical Invariant Enforcement

This schema structurally prevents misuse:

- No field can encode blame
- No field can encode cause
- No field can encode intent

If someone tries to add:

```typescript
cause?: string;
```

…it should feel obviously wrong.

That friction is intentional.

---

## 9. Backward Compatibility Guarantee

Example versioning:

```json
{
  "schemaVersion": "2.0",
  "report": { "...V1..." },
  "run": { "..." },
  "changes": [],
  "trends": []
}
```

A V1-only consumer can safely ignore everything except `report`.

This is trust preservation over time.

---

## 10. Implementation Order (V2-Safe)

When implementing V2, proceed in this order:

1. Add `DriftReportV2` types
2. Embed V1 report (unchanged)
3. Implement report diff → `ChangeEvent[]`
4. Implement trends (read-only, no reclassification)
5. Implement continuity signal
6. Stop

**No UI.**  
**No prose expansion.**  
**No AI.**

---

## Final Sanity Check

Before shipping V2, ask:

> “Could a manager misuse this report to assign blame more easily than V1?”

If the answer is **no**, the design has succeeded.

This schema passes that test.
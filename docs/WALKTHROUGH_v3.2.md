# apiscope v3.2 — Correctness & Robustness Release

Version **3.2.0** improves correctness of drift detection, strengthens robustness against adversarial inputs, and slightly improves observation fidelity.

The release is intentionally **surgical**: it fixes specific gaps identified during code audit without altering the architecture or the system’s observational design philosophy.

No changes were made to the report schema or CLI behavior beyond new findings that represent previously undetected drift.

---

# Design Goal of v3.2

v3.2 addresses three concrete limitations discovered during external review:

1. **Undocumented endpoints were silently ignored**
2. **OpenAPI `allOf` schema composition was not recognized**
3. **Status-code drift detection was incomplete**

In addition, several robustness improvements were added to ensure safe behavior under malformed or adversarial inputs.

All changes preserve the project invariant:

> Reports must describe observed evidence without asserting correctness, causality, or enforcement.

---

# Changes

## P0 — Correctness Fixes

### Undocumented Endpoint Detection

Previously, traffic hitting endpoints not present in the specification was ignored.

Example:

```
Spec:
/users
/orders

Traffic:
/internal/reset
```

Prior behavior:

```
(no findings)
```

New behavior:

```
undocumented-endpoint
method: POST
path: /internal/reset
samples: 14
```

The detection occurs during endpoint grouping in `drift-detector.ts`.

Only one finding is emitted per endpoint group to avoid duplicate reports.

---

### `allOf` Schema Merging

OpenAPI schemas using `allOf` were previously not merged during schema extraction.

Example schema:

```
User:
  allOf:
    - $ref: BaseUser
    - properties:
        createdAt:
          type: string
```

Earlier versions could misidentify `createdAt` as undocumented.

v3.2 introduces a recursive merge step inside `schema-comparator.ts`:

* `properties` are merged
* `required` arrays are merged
* nested `allOf` blocks are resolved recursively

This produces the effective field set before comparison.

---

### Status-Code Comparison Completeness

Earlier logic assumed the primary success response was:

```
200 or 201
```

This failed for APIs returning:

```
204
206
207
```

v3.2 introduces a full status comparison strategy:

Observed status codes are checked against the specification.

```
if status in spec.responses → use that schema
else if default exists → use default schema
else → undocumented-status-code
```

Additionally, the reverse comparison is performed:

```
spec status not observed → missing-status-code
```

The `default` response is excluded from reverse comparison to avoid false positives.

---

# P1 — Robustness Improvements

## Traversal Depth Guard

Deeply nested JSON payloads could cause recursive traversal overflow.

Example adversarial payload:

```
{a:{a:{a:{a:{...}}}}}
```

v3.2 introduces:

```
MAX_JSON_DEPTH = 200
```

When this depth is reached, traversal stops safely.

This prevents stack overflow without altering observation semantics.

---

## Timestamp Validation

Observation windows previously trusted all timestamps.

Invalid timestamps could propagate into window computation.

v3.2 validates timestamps using `Date.parse()`.

Invalid samples are skipped during window construction.

---

## Path Matcher Specificity

Path template resolution could previously produce ambiguous matches.

Example:

```
/users/me
/users/{id}
```

Traffic:

```
/users/me
```

v3.2 introduces deterministic template ordering:

Priority:

1. static segment count
2. parameter segment count
3. path length

This ensures exact routes are preferred over parameterized templates.

---

# P2 — Observation Fidelity

## Bounded Array Sampling

Earlier versions inspected only the first element of arrays.

Example:

```
[{a:1},{b:2}]
```

Only `a` would be observed.

v3.2 samples the first **three elements**:

```
array.slice(0,3)
```

This increases field discovery while maintaining bounded cost.

---

# Verification

A new test suite `v3.2.test.ts` was added.

Coverage includes:

* undocumented endpoint detection
* recursive `allOf` schema merging
* status-code completeness
* `default` schema handling
* deep JSON traversal safety
* heterogeneous array sampling
* invalid timestamp handling
* path matcher specificity

Test results:

```
Test Suites: 1 passed
Tests:       8 passed
Snapshots:   0
Time:        ~1.1s
```

### System Invariants

A second test suite `invariants.test.ts` was added to verify system-level properties:

* **Determinism**: Verified identical findings for identical inputs.
* **Order Stability**: Verified findings appear in stable order regardless of input sample sequence.
* **Large Window Safety**: Verified analysis handles 10k samples without failure.
* **Schema Composition Stability**: Verified `allOf` merging produces result identical to flattened specification.

Test results:

```
Test Suites: 1 passed
Tests:       4 passed
```

Existing test suites also pass.

---

# Version

```
Version: 3.2.0
```

Updated in:

```
package.json
```

---

# Architectural Impact

None.

The following boundaries remain unchanged:

```
ingestion
observation
comparison
report
presentation
```

No interpretation logic was added to observation or comparison layers.

---

# Result

After v3.2, apiscope correctly handles:

* undocumented endpoints
* OpenAPI schema composition (`allOf`)
* full status-code drift detection
* heterogeneous array structures (basic)
* adversarial deep JSON payloads
* ambiguous path template matches

The system remains deterministic in analysis and continues to produce evidence-oriented reports.

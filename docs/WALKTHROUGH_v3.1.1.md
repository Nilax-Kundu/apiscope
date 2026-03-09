# apiscope — v3.1.1 Reliability & Correctness Fixes

This release addresses several issues discovered during external code review and stress testing.
The focus of this update is reliability under large input volumes, detection correctness, and endpoint matching fidelity, while preserving the project's observational design constraints.

No architectural changes or new features were introduced.

## Summary of Fixes

| Priority | Area | Issue | Resolution |
| :--- | :--- | :--- | :--- |
| **P0** | Observation Window | Stack overflow on large traffic datasets | Replaced spread min/max with linear scan |
| **P1** | Drift Detection | Required fields never observed were not reported | Detection logic corrected |
| **P1** | Endpoint Matching | OpenAPI templated paths not matched | Introduced path template normalization |
| **P2** | Field Observation | Root primitive bodies ignored | Guard condition corrected |

## Detailed Changes

### 1. Observation Window Stability
#### Problem
`buildObservationWindow` previously calculated timestamp bounds using array spread:
```typescript
Math.min(...timestamps)
Math.max(...timestamps)
```
For large traffic windows (hundreds of thousands of samples), this can exceed the JavaScript engine's argument stack limit, causing `Error: Maximum call stack size exceeded`. This failure was reproducible under stress tests with ~500k samples.

#### Solution
The implementation now performs a linear scan to determine timestamp bounds directly within the sample iteration, eliminating stack risk and reducing memory pressure while maintaining O(n) complexity.

### 2. Missing Required Fields Detection
#### Problem
Required fields defined in the OpenAPI specification were only reported as missing if they appeared at least once but with insufficient frequency. Fields that were never observed were silently ignored.

#### Solution
Detection logic now emits a `missing-field` finding when a field is required in the spec but entirely absent from observations. Each finding includes observation window, sample count, and endpoint scope for full evidence context.

### 3. Path Template Matching
#### Problem
Endpoint comparison previously relied on exact string matching. Templated paths like `/users/{id}` did not match observed paths like `/users/123`, causing legitimate traffic samples to be excluded from analysis.

#### Solution
Introduced `src/path-matcher.ts` to convert OpenAPI templates into regex patterns (e.g., `/users/{id}` → `^/users/[^/]+$`). Traffic paths are matched against these patterns before grouping observations. The matcher remains minimal by design to avoid the complexity of a full routing engine.

### 4. Primitive Root JSON Bodies
#### Problem
`FieldObserver.observeBody` used a falsy guard (`if (!body)`) which incorrectly excluded valid JSON primitives like `0`, `false`, and `""`.

#### Solution
The guard now checks explicitly for absence: `if (body === undefined || body === null)`. This ensures primitive payloads are correctly observed.

---

## Verification Results

### Automated Tests
- **Test Suites**: 15 passed
- **Tests**: 78 passed
- **Status**: ✅ PASS

New test suite `src/v3.1.1-fixes.test.ts` verified:
- Linear scan window calculation
- Required-field absence detection
- Path template normalization
- Primitive body observation

### Build Status
`npm run build` — ✅ TypeScript compilation successful.

## Release Metadata
- **Version**: `v3.1.1`
- **Classification**: Patch release
- **Scope**: Reliability improvements, correctness fixes, detection fidelity.

Closing Notes: This update improves the robustness of apiscope under real-world conditions while maintaining the project's core design principle: observations must remain descriptive, contextual, and non-authoritative.

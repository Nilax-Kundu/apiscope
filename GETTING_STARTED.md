# Getting Started with apiscope

## Quick Start

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run V3 analysis (Recommended)
apiscope <spec-file> <traffic-file> \
  --v2 --service-name my-api --environment prod \
  --v3 --compact
```

## Three Modes of Operation

This tool has evolved through three versions, all currently supported. Features are additive.

### 1. V1 Mode: Base Drift Detection
Simple, stateless comparison of spec vs. traffic.

```bash
apiscope openapi.yaml traffic.json
```
*   **Best for:** CI/CD one-off checks, local debugging.
*   **Outputs:** Standard JSON report of immediate drift.

### 2. V2 Mode: Longitudinal Observation
Adds history, trends, and change detection over time.

```bash
apiscope openapi.yaml traffic.json \
  --v2 --service-name <name> --environment <env>
```
*   **Best for:** Production monitoring, tracking regression.
*   **Features:**
    *   Saves reports to `.drift-reports/`
    *   Tracks "New" vs "Missing" findings across runs
    *   Analyzes stability and frequency trends

### 3. V3 Mode: Safe Usability Frontier (Recommended)
Adds human-centric presentation features without interpretation.

```bash
apiscope openapi.yaml traffic.json \
  --v2 --service-name <name> --environment <env> \
  --v3 --compact --group-by endpoint
```
*   **Best for:** Human consumption, daily reviews.
*   **Features:**
    *   `--compact`: Hides low-confidence noise (shows N of M counter).
    *   `--group-by`: Organizes findings by endpoint/field/status.
    *   `--format`: Output as `json`, `json-pretty`, or `ndjson`.
    *   **ASCII Trends**: Visual frequency history (e.g., `▂▂▆▆█`).
    *   **Delta Headers**: "2 findings appeared, 1 disappeared".

## Key Flags

| Flag | Mode | Description |
|------|------|-------------|
| `--v2` | V2 | Enables history tracking (requires service/env names) |
| `--service-name` | V2 | Identity for the API being tracked |
| `--environment` | V2 | Context (e.g., `prod`, `staging`) |
| `--v3` | V3 | Enables presentation layer (requires `--v2`) |
| `--compact` | V3 | Hides low-severity/low-confidence findings |
| `--verbose` | V3 | Show all findings (default) |
| `--group-by` | V3 | `endpoint`, `field`, `status`, or `none` |
| `--format` | V3 | `json` (default), `json-pretty`, `ndjson` |

## Example Traffic Format

Input traffic samples should be a JSON array of request/response pairs:

```json
[
  {
    "timestamp": "2026-02-03T10:00:00Z",
    "method": "GET",
    "path": "/api/users/123",
    "statusCode": 200,
    "responseBody": { "id": 123, "name": "Alice" }
  }
]
```

## Architecture & Constraints

This tool follows strict "Refusal" invariants (see [REFUSALS.md](REFUSALS.md)):
*   ❌ No Causal Attribution ("Why did this happen?")
*   ❌ No Blame/Ownership ("Who broke this?")
*   ❌ No Recommendations ("How do I fix this?")
*   ✅ Only clear, structured evidence.

See [WALKTHROUGH.md](WALKTHROUGH.md) for detailed verification of V3 features.

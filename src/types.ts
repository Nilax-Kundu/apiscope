/**
 * Core type definitions for ObservedAPIdrift.
 * All types are pure data structures with explicit context and uncertainty.
 * 
 * V1 types (lines 1-232) are frozen - DO NOT MODIFY
 * V2 types (lines 233+) extend V1 for longitudinal observation
 */

/**
 * HTTP method types
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

/**
 * JSON primitive types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;
export interface JsonObject {
    [key: string]: JsonValue;
}
export type JsonArray = JsonValue[];

/**
 * Captured HTTP request/response pair from traffic sample
 */
export interface TrafficSample {
    /** ISO 8601 timestamp of when this sample was captured */
    timestamp: string;

    /** HTTP method */
    method: HttpMethod;

    /** Request path (e.g., "/api/users/123") */
    path: string;

    /** HTTP status code from response */
    statusCode: number;

    /** Request body (if present) */
    requestBody?: JsonValue;

    /** Response body (if present) */
    responseBody?: JsonValue;
}

/**
 * Time range and sample metadata for observations
 */
export interface ObservationWindow {
    /** ISO 8601 timestamp of earliest sample */
    startTime: string;

    /** ISO 8601 timestamp of latest sample */
    endTime: string;

    /** Total number of samples in this window */
    sampleCount: number;
}

/**
 * Observed behavior for a single field in response/request bodies
 */
export interface FieldObservation {
    /** JSON path to the field (e.g., "user.email") */
    path: string;

    /** Number of samples where this field was present */
    occurrenceCount: number;

    /** Percentage of samples where this field was present (0-100) */
    occurrencePercentage: number;

    /** Types observed for this field (e.g., ["string", "null"]) */
    observedTypes: string[];

    /** Sample values observed (for variant detection, limited to first N unique values) */
    sampleValues: JsonValue[];
}

/**
 * Aggregated observations for a single API endpoint
 */
export interface EndpointObservation {
    /** HTTP method */
    method: HttpMethod;

    /** Request path */
    path: string;

    /** Observation window metadata */
    window: ObservationWindow;

    /** Field observations from response bodies */
    responseFields: FieldObservation[];

    /** Field observations from request bodies (if applicable) */
    requestFields: FieldObservation[];

    /** Status codes observed with counts */
    statusCodes: Record<number, number>;
}

/**
 * Raw inputs for confidence assessment (not a final confidence score)
 * 
 * Note: Confidence scores are not calculated by design.
 * This system reports inputs for human judgment, not final scores.
 */
export interface ConfidenceInputs {
    /** Total sample count for this observation */
    sampleCount: number;

    /** Consistency percentage: what % of samples showed this pattern (0-100) */
    consistencyPercentage: number;

    /** Duration of observation window in milliseconds */
    windowDurationMs: number;
}

/**
 * Severity level for drift findings (based on data, not judgment)
 * 
 * Note: Severity reflects data patterns, not business impact.
 * High severity means strong statistical signal, not "this is important."
 */
export type SeverityLevel = 'high' | 'medium' | 'low';

/**
 * Type of divergence between spec and observed behavior
 */
export type DriftType =
    | 'undocumented-field'      // Field observed but not in spec
    | 'missing-field'            // Field in spec but rarely/never observed  
    | 'type-mismatch'            // Observed type differs from spec
    | 'undocumented-status-code' // Status code observed but not in spec
    | 'missing-status-code';     // Status code in spec but not observed

/**
 * Evidence of divergence between spec and observed behavior
 */
export interface DriftFinding {
    /** Type of drift detected */
    type: DriftType;

    /** HTTP method */
    method: HttpMethod;

    /** Request path */
    path: string;

    /** Field path (if field-level drift) */
    fieldPath?: string;

    /** Status code (if status-code-level drift) */
    statusCode?: number;

    /** What was observed */
    observed: {
        /** Observed value/type/status */
        value?: JsonValue;
        /** Observed type(s) */
        types?: string[];
        /** Occurrence count */
        count?: number;
        /** Occurrence percentage (0-100) */
        percentage?: number;
    };

    /** What spec documented (if anything) */
    documented?: {
        /** Expected type(s) from spec */
        types?: string[];
        /** Whether field is required in spec */
        required?: boolean;
        /** Expected status codes from spec */
        statusCodes?: number[];
    };

    /** Confidence inputs (not final score) */
    confidence: ConfidenceInputs;

    /** Severity level */
    severity: SeverityLevel;

    /** Observation window */
    window: ObservationWindow;
}

/**
 * Complete drift report structure
 */
export interface DriftReport {
    /** Observation window for this report */
    window: ObservationWindow;

    /** Total number of endpoints analyzed */
    endpointsAnalyzed: number;

    /** Findings detected (filtered by default to high-severity + high-confidence) */
    findings: DriftFinding[];

    /** Whether this report has been filtered */
    filtered: boolean;

    /** Filter criteria applied (if any) */
    filterCriteria?: {
        minSeverity?: SeverityLevel;
        minSampleCount?: number;
        minConsistencyPercentage?: number;
    };
}

/**
 * Affirmative empty state when no significant drift detected
 */
export interface EmptyDriftReport extends DriftReport {
    /** Findings array will be empty */
    findings: [];

    /** Explicit indicator that observation occurred successfully */
    observationComplete: true;
}

/**
 * OpenAPI endpoint definition (minimal subset needed for comparison)
 */
export interface SpecEndpoint {
    /** HTTP method */
    method: HttpMethod;

    /** Request path */
    path: string;

    /** Expected response schemas by status code */
    responses: Record<number, JsonObject>;

    /** Expected request body schema (if applicable) */
    requestBody?: JsonObject;
}

// ============================================================================
// V2 TYPES - Longitudinal Observation
// ============================================================================

/**
 * Run metadata - identity only, no conclusions
 */
export interface RunMetadata {
    /** Unique run identifier (UUID) */
    runId: string;

    /** ISO 8601 timestamp of when this run was executed */
    executedAt: string;

    /** Service name being analyzed */
    serviceName: string;

    /** Environment (e.g., "production", "staging") */
    environment: string;

    /** SHA-256 hash of spec file content */
    specHash: string;

    /** Tool version (e.g., "2.0.0") */
    toolVersion: string;
}

/**
 * Reference to previous run - no data copying, reference only
 */
export interface PreviousRunRef {
    /** Previous run ID */
    runId: string;

    /** When previous run was executed */
    executedAt: string;
}

/**
 * Scope identifying a drift finding across runs
 */
export interface FindingScope {
    /** HTTP method */
    method: HttpMethod;

    /** Request path */
    path: string;

    /** Field path (if field-level finding) */
    fieldPath?: string;

    /** Status code (if status-code-level finding) */
    statusCode?: number;
}

/**
 * Partial snapshot of finding state - only changed fields included
 */
export interface ChangeSnapshot {
    /** Severity level (may include 'benign' in V2) */
    severity?: SeverityLevel | 'benign';

    /** Observed frequency percentage */
    frequencyPercentage?: number;

    /** Sample count */
    sampleCount?: number;

    /** Confidence inputs */
    confidenceInputs?: ConfidenceInputs;
}

/**
 * Type of change detected between runs
 */
export type ChangeType =
    | 'finding_appeared'        // Finding exists in current, not in previous
    | 'finding_disappeared'     // Finding exists in previous, not in current
    | 'severity_shift'          // Severity changed
    | 'frequency_shift'         // Observed frequency changed significantly
    | 'confidence_shift';       // Confidence inputs changed significantly

/**
 * Evidence of change between runs - what changed, not what it means
 */
export interface ChangeEvent {
    /** Unique change identifier (UUID) */
    changeId: string;

    /** Type of change detected */
    changeType: ChangeType;

    /** Scope of the finding that changed */
    scope: FindingScope;

    /** Previous state (partial) */
    previous?: ChangeSnapshot;

    /** Current state (partial) */
    current?: ChangeSnapshot;
}

/**
 * Frequency band classification based on observed occurrence
 */
export type FrequencyBand =
    | 'rare'          // <10% avg occurrence
    | 'intermittent'  // 10-40% avg occurrence
    | 'common'        // 40-80% avg occurrence
    | 'dominant';     // >80% avg occurrence

/**
 * Confidence evolution over time
 */
export type ConfidenceTrend =
    | 'strengthening'      // Sample count increasing
    | 'weakening'          // Sample count decreasing
    | 'stable'             // Variance <20%
    | 'insufficient_data'; // <3 runs

/**
 * Stability assessment - earned, not assumed
 */
export type Stability =
    | 'stable'     // Present in >80% of runs with low variance
    | 'volatile'   // Presence varies significantly
    | 'emerging';  // Appeared recently (last 2-3 runs)

/**
 * Trend summary across multiple runs - descriptive, not normative
 */
export interface TrendSummary {
    /** Scope of the finding being tracked */
    scope: FindingScope;

    /** Number of runs observed */
    observationCount: number;

    /** Frequency band classification */
    frequencyBand: FrequencyBand;

    /** Confidence trend over time */
    confidenceTrend: ConfidenceTrend;

    /** Stability assessment */
    stability: Stability;
}

/**
 * Longitudinal continuity signal - silence made visible
 */
export interface ContinuitySignal {
    /** Number of runs compared */
    comparedRuns: number;

    /** Number of findings that remained unchanged */
    unchangedFindings: number;

    /** Generated message (not inferred) */
    message: string;
}

/**
 * Spec change detection - global context,not per-finding interpretation
 */
export interface SpecChange {
    /** Previous spec hash */
    previousHash: string;

    /** Current spec hash */
    currentHash: string;

    /** Explanatory note (data only, no causality) */
    note: string;
}

/**
 * V2 Drift Report - superset of V1, adds temporal context
 * 
 * INVARIANT: V1 report must be extractable as `v2.report` and remain valid
 * INVARIANT: V2 adds context, never reinterprets V1 findings
 */
export interface DriftReportV2 {
    /** Schema version identifier */
    schemaVersion: '2.0';

    /** V1 report (frozen, unchanged) */
    report: DriftReport;

    /** This run's metadata */
    run: RunMetadata;

    /** Previous run reference (if available) */
    previousRun?: PreviousRunRef;

    /** Spec change detection (only if spec changed) */
    specChange?: SpecChange;

    /** Report-to-report diff events */
    changes: ChangeEvent[];

    /** Trend summaries from recent runs */
    trends: TrendSummary[];

    /** Continuity signal (if applicable) */
    continuity?: ContinuitySignal;
}

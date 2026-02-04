/**
 * Report builder
 * Builds structured drift reports with filtering
 */

import {
    DriftReport,
    DriftFinding,
    SeverityLevel,
    ObservationWindow,
} from '../types.js';

/**
 * Default filter criteria for V1
 */
const DEFAULT_MIN_SEVERITY: SeverityLevel = 'medium';
const DEFAULT_MIN_SAMPLE_COUNT = 5;
const DEFAULT_MIN_CONSISTENCY_PERCENTAGE = 10;

/**
 * Filters findings based on criteria
 */
function filterFindings(
    findings: DriftFinding[],
    minSeverity: SeverityLevel = DEFAULT_MIN_SEVERITY,
    minSampleCount: number = DEFAULT_MIN_SAMPLE_COUNT,
    minConsistencyPercentage: number = DEFAULT_MIN_CONSISTENCY_PERCENTAGE
): DriftFinding[] {
    const severityOrder: Record<SeverityLevel, number> = {
        low: 0,
        medium: 1,
        high: 2,
    };

    return findings.filter(f => {
        // Check severity
        if (severityOrder[f.severity] < severityOrder[minSeverity]) {
            return false;
        }

        // Check sample count
        if (f.confidence.sampleCount < minSampleCount) {
            return false;
        }

        // Check consistency
        if (f.confidence.consistencyPercentage < minConsistencyPercentage) {
            return false;
        }

        return true;
    });
}

/**
 * Sorts findings deterministically (V3 enhancement)
 * 
 * Sort order (explicit and static):
 * 1. Severity (high > medium > low)
 * 2. Sample count (descending)
 * 3. Field path (lexical, for deterministic ordering)
 * 
 * INVARIANT: No hidden heuristics. Users can predict scan order.
 */
function sortFindings(findings: DriftFinding[]): DriftFinding[] {
    const severityOrder: Record<SeverityLevel, number> = {
        high: 2,
        medium: 1,
        low: 0,
    };

    return findings.sort((a, b) => {
        // 1. Severity (high > medium > low)
        const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
        if (severityDiff !== 0) return severityDiff;

        // 2. Sample count (descending)
        const sampleCountDiff = b.confidence.sampleCount - a.confidence.sampleCount;
        if (sampleCountDiff !== 0) return sampleCountDiff;

        // 3. Lexical by field path (deterministic tie-breaker)
        const aPath = a.fieldPath || '';
        const bPath = b.fieldPath || '';
        return aPath.localeCompare(bPath);
    });
}

/**
 * Builds drift report from findings
 */
export function buildDriftReport(
    findings: DriftFinding[],
    window: ObservationWindow,
    endpointsAnalyzed: number,
    applyDefaultFilter: boolean = true
): DriftReport {
    let filteredFindings = findings;
    let filtered = false;
    let filterCriteria = undefined;

    if (applyDefaultFilter) {
        filteredFindings = filterFindings(findings);
        filtered = true;
        filterCriteria = {
            minSeverity: DEFAULT_MIN_SEVERITY,
            minSampleCount: DEFAULT_MIN_SAMPLE_COUNT,
            minConsistencyPercentage: DEFAULT_MIN_CONSISTENCY_PERCENTAGE,
        };
    }

    return {
        window,
        endpointsAnalyzed,
        findings: sortFindings(filteredFindings),
        filtered,
        filterCriteria,
    };
}

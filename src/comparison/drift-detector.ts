/**
 * Drift detector
 * Produces DriftFinding objects from comparisons
 */

import {
    DriftFinding,
    SeverityLevel,
    EndpointObservation,
    SpecEndpoint,
    ConfidenceInputs,
} from '../types.js';
import { compareFields, typesMatch } from './schema-comparator.js';

/**
 * Determines severity based on occurrence percentage and consistency
 */
function determineSeverity(occurrencePercentage: number, sampleCount: number): SeverityLevel {
    // High severity: >80% occurrence or very consistent pattern with decent sample size
    if (occurrencePercentage > 80 || (occurrencePercentage > 50 && sampleCount > 10)) {
        return 'high';
    }

    // Low severity: <20% occurrence or very small sample
    if (occurrencePercentage < 20 || sampleCount < 5) {
        return 'low';
    }

    return 'medium';
}

/**
 * Calculates confidence inputs from observation data
 */
function calculateConfidenceInputs(
    observation: EndpointObservation,
    consistencyPercentage: number
): ConfidenceInputs {
    const windowStart = new Date(observation.window.startTime).getTime();
    const windowEnd = new Date(observation.window.endTime).getTime();

    return {
        sampleCount: observation.window.sampleCount,
        consistencyPercentage,
        windowDurationMs: windowEnd - windowStart,
    };
}

/**
 * Detects drift between spec endpoint and observed behavior
 */
export function detectDrift(
    specEndpoint: SpecEndpoint | undefined,
    observation: EndpointObservation
): DriftFinding[] {
    const findings: DriftFinding[] = [];

    // If no spec found, all observations are potentially undocumented
    if (!specEndpoint) {
        // This could be reported, but for V1 we focus on endpoints that exist in spec
        return findings;
    }

    // Compare response fields for each status code
    for (const [statusCode, count] of Object.entries(observation.statusCodes)) {
        const code = parseInt(statusCode, 10);
        const specResponse = specEndpoint.responses[code];

        // Undocumented status code
        if (!specResponse) {
            const percentage = (count / observation.window.sampleCount) * 100;

            findings.push({
                type: 'undocumented-status-code',
                method: observation.method,
                path: observation.path,
                statusCode: code,
                observed: {
                    count,
                    percentage,
                },
                documented: {
                    statusCodes: Object.keys(specEndpoint.responses).map(Number),
                },
                confidence: calculateConfidenceInputs(observation, percentage),
                severity: determineSeverity(percentage, count),
                window: observation.window,
            });
        }
    }

    // Compare response fields (using primary success response)
    const successResponse = specEndpoint.responses[200] || specEndpoint.responses[201];
    if (successResponse) {
        const fieldComparisons = compareFields(successResponse, observation.responseFields);

        for (const comp of fieldComparisons) {
            // Undocumented field (observed but not in spec)
            if (!comp.inSpec && comp.inObserved) {
                findings.push({
                    type: 'undocumented-field',
                    method: observation.method,
                    path: observation.path,
                    fieldPath: comp.fieldPath,
                    observed: {
                        types: comp.observedTypes,
                        percentage: comp.observedOccurrencePercentage,
                    },
                    confidence: calculateConfidenceInputs(observation, comp.observedOccurrencePercentage || 0),
                    severity: determineSeverity(comp.observedOccurrencePercentage || 0, observation.window.sampleCount),
                    window: observation.window,
                });
            }

            // Missing field (in spec but rarely/never observed)
            if (comp.inSpec && comp.inObserved && comp.specRequired && (comp.observedOccurrencePercentage || 0) < 50) {
                findings.push({
                    type: 'missing-field',
                    method: observation.method,
                    path: observation.path,
                    fieldPath: comp.fieldPath,
                    observed: {
                        types: comp.observedTypes,
                        percentage: comp.observedOccurrencePercentage,
                    },
                    documented: {
                        types: comp.specTypes,
                        required: comp.specRequired,
                    },
                    confidence: calculateConfidenceInputs(observation, 100 - (comp.observedOccurrencePercentage || 0)),
                    severity: determineSeverity(100 - (comp.observedOccurrencePercentage || 0), observation.window.sampleCount),
                    window: observation.window,
                });
            }

            // Type mismatch
            if (comp.inSpec && comp.inObserved && !typesMatch(comp.specTypes, comp.observedTypes)) {
                findings.push({
                    type: 'type-mismatch',
                    method: observation.method,
                    path: observation.path,
                    fieldPath: comp.fieldPath,
                    observed: {
                        types: comp.observedTypes,
                        percentage: comp.observedOccurrencePercentage,
                    },
                    documented: {
                        types: comp.specTypes,
                    },
                    confidence: calculateConfidenceInputs(observation, comp.observedOccurrencePercentage || 0),
                    severity: determineSeverity(comp.observedOccurrencePercentage || 0, observation.window.sampleCount),
                    window: observation.window,
                });
            }
        }
    }

    return findings;
}

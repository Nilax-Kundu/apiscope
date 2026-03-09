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

    // 1. Undocumented endpoint detection
    if (!specEndpoint) {
        findings.push({
            type: 'undocumented-endpoint',
            method: observation.method,
            path: observation.path,
            observed: {
                count: observation.window.sampleCount,
            },
            confidence: calculateConfidenceInputs(observation, 100),
            severity: determineSeverity(100, observation.window.sampleCount),
            window: observation.window,
        });
        return findings;
    }

    // 2. Status code comparison
    const observedCodes = new Set(Object.keys(observation.statusCodes).map(Number));
    const specCodes = Object.keys(specEndpoint.responses);
    const hasDefault = specCodes.includes('default');
    const numericSpecCodes = specCodes.filter(c => c !== 'default').map(Number);

    // Pre-calculate all documented fields for suppression of false positives in undocumented-field detection
    // (since observations are currently global across all status codes)
    const allDocumentedFields = new Set<string>();
    for (const schema of Object.values(specEndpoint.responses)) {
        const comparisons = compareFields(schema, []);
        for (const comp of comparisons) {
            if (comp.inSpec) allDocumentedFields.add(comp.fieldPath);
        }
    }

    // Check each observed status
    for (const [statusCode, count] of Object.entries(observation.statusCodes)) {
        const code = parseInt(statusCode, 10);
        let specResponse = specEndpoint.responses[code];
        
        // Use default if exact match not found
        if (!specResponse && hasDefault) {
            specResponse = specEndpoint.responses['default'];
        }

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
                    statusCodes: numericSpecCodes,
                },
                confidence: calculateConfidenceInputs(observation, percentage),
                severity: determineSeverity(percentage, count),
                window: observation.window,
            });
        } else {
            // Compare fields for this specific status code
            const fieldComparisons = compareFields(specResponse, observation.responseFields);
            for (const comp of fieldComparisons) {
                // Undocumented field
                if (!comp.inSpec && comp.inObserved) {
                    // Suppress if documented for ANY status code of this endpoint
                    if (allDocumentedFields.has(comp.fieldPath)) {
                        continue;
                    }

                    findings.push({
                        type: 'undocumented-field',
                        method: observation.method,
                        path: observation.path,
                        fieldPath: comp.fieldPath,
                        statusCode: code,
                        observed: {
                            types: comp.observedTypes,
                            percentage: comp.observedOccurrencePercentage,
                        },
                        confidence: calculateConfidenceInputs(observation, comp.observedOccurrencePercentage || 0),
                        severity: determineSeverity(comp.observedOccurrencePercentage || 0, observation.window.sampleCount),
                        window: observation.window,
                    });
                }

                // Missing field
                const isRequiredButMissing = comp.inSpec && comp.specRequired && !comp.inObserved;
                const isRarelyObserved = comp.inSpec && comp.inObserved && comp.specRequired && (comp.observedOccurrencePercentage || 0) < 50;

                if (isRequiredButMissing || isRarelyObserved) {
                    findings.push({
                        type: 'missing-field',
                        method: observation.method,
                        path: observation.path,
                        fieldPath: comp.fieldPath,
                        statusCode: code,
                        observed: {
                            types: comp.observedTypes || [],
                            percentage: comp.observedOccurrencePercentage || 0,
                            count: comp.observedCount || 0,
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
                        statusCode: code,
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
    }

    // 3. Missing status code detection
    for (const specCode of numericSpecCodes) {
        if (!observedCodes.has(specCode)) {
            findings.push({
                type: 'missing-status-code',
                method: observation.method,
                path: observation.path,
                statusCode: specCode,
                observed: {
                    count: 0,
                    percentage: 0,
                },
                documented: {
                    statusCodes: numericSpecCodes,
                },
                confidence: calculateConfidenceInputs(observation, 0),
                severity: 'medium', // Default severity for missing status
                window: observation.window,
            });
        }
    }

    return findings;
}

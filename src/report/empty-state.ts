/**
 * Empty state handler
 * Produces affirmative "nothing happened" reports
 */

import { EmptyDriftReport, ObservationWindow } from '../types.js';

/**
 * Creates an affirmative empty state report
 * This is not a failure or error - it explicitly confirms observation occurred
 */
export function createEmptyReport(
    window: ObservationWindow,
    endpointsAnalyzed: number
): EmptyDriftReport {
    return {
        window,
        endpointsAnalyzed,
        findings: [],
        filtered: true,
        filterCriteria: {
            minSeverity: 'medium',
            minSampleCount: 5,
            minConsistencyPercentage: 10,
        },
        observationComplete: true,
    };
}

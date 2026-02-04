/**
 * Confidence analyzer
 * Calculates confidence trends and stability based on sample counts and variance
 */

import { ConfidenceTrend, Stability } from '../types.js';

/**
 * Calculate confidence trend based on sample count history
 * History is ordered from oldest to newest
 */
export function calculateConfidenceTrend(sampleCounts: number[]): ConfidenceTrend {
    if (sampleCounts.length < 3) {
        return 'insufficient_data';
    }

    // Simple linear regression slope could be used here, but for V2 we'll keep it simple
    // Check if consistently increasing (allowing for small variance)
    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < sampleCounts.length; i++) {
        if (sampleCounts[i] > sampleCounts[i - 1]) increasing++;
        if (sampleCounts[i] < sampleCounts[i - 1]) decreasing++;
    }

    const totalSteps = sampleCounts.length - 1;

    if (increasing > totalSteps * 0.7) return 'strengthening';
    if (decreasing > totalSteps * 0.7) return 'weakening';

    // Check for stability (variance within 20% of mean)
    const mean = sampleCounts.reduce((a, b) => a + b, 0) / sampleCounts.length;
    const variance = sampleCounts.every(c => Math.abs(c - mean) / mean < 0.2);

    if (variance) return 'stable';

    // Default to stable if no clear trend, but this might need refinement
    return 'stable';
}

/**
 * Assess stability of a finding over time
 * @param presenceHistory boolean array indicating if finding was present in each run
 */
export function assessStability(presenceHistory: boolean[]): Stability {
    const runCount = presenceHistory.length;

    if (runCount < 3) return 'emerging';

    // Check if present in recent runs
    const presenceCount = presenceHistory.filter(p => p).length;
    const presenceRate = presenceCount / runCount;

    if (presenceRate > 0.8) return 'stable';

    // Check if it just appeared recently (last 2-3 runs) but wasn't there before
    const recentPresence = presenceHistory.slice(-3);
    const olderPresence = presenceHistory.slice(0, -3);

    if (olderPresence.every(p => !p) && recentPresence.some(p => p)) {
        return 'emerging';
    }

    return 'volatile';
}

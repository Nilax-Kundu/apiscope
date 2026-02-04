/**
 * Frequency analyzer
 * Calculates frequency bands from occurrence history
 */

import { FrequencyBand } from '../types.js';

/**
 * Calculate frequency band based on average occurrence percentage
 * 
 * Bands:
 * - rare: <10%
 * - intermittent: 10-40%
 * - common: 40-80%
 * - dominant: >80%
 */
export function calculateFrequencyBand(averagePercentage: number): FrequencyBand {
    if (averagePercentage > 80) return 'dominant';
    if (averagePercentage > 40) return 'common';
    if (averagePercentage >= 10) return 'intermittent';
    return 'rare';
}

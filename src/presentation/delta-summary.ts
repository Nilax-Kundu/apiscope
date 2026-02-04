/**
 * Run-to-Run Delta Summary for V3
 * Quantitative change counts - navigation aid only
 * 
 * INVARIANT: Does not say if changes are good or bad
 */

import { ChangeEvent } from '../types.js';

/**
 * Delta summary structure
 */
export interface DeltaSummary {
    /** Number of findings that appeared since last run */
    appeared: number;

    /** Number of findings that disappeared since last run */
    disappeared: number;

    /** Number of severity shifts up or down */
    severityShifts: number;

    /** Number of frequency shifts (significant changes) */
    frequencyShifts: number;
}

/**
 * Build delta summary from change events
 * 
 * @param changes - Change events from V2 report
 * @returns Quantitative summary of changes
 */
export function buildDeltaSummary(changes: ChangeEvent[]): DeltaSummary {
    const appeared = changes.filter(c => c.changeType === 'finding_appeared').length;
    const disappeared = changes.filter(c => c.changeType === 'finding_disappeared').length;
    const severityShifts = changes.filter(c => c.changeType === 'severity_shift').length;
    const frequencyShifts = changes.filter(c => c.changeType === 'frequency_shift').length;

    return { appeared, disappeared, severityShifts, frequencyShifts };
}

/**
 * Format delta summary for display
 * 
 * INVARIANT: Quantitative only - no interpretation of whether changes are good or bad
 */
export function formatDeltaSummary(summary: DeltaSummary): string {
    const lines = ['Since last run:'];

    if (summary.appeared > 0) {
        lines.push(`- ${summary.appeared} finding${summary.appeared === 1 ? '' : 's'} appeared`);
    }
    if (summary.disappeared > 0) {
        lines.push(`- ${summary.disappeared} finding${summary.disappeared === 1 ? '' : 's'} disappeared`);
    }
    if (summary.severityShifts > 0) {
        lines.push(`- ${summary.severityShifts} severity shift${summary.severityShifts === 1 ? '' : 's'}`);
    }
    if (summary.frequencyShifts > 0) {
        lines.push(`- ${summary.frequencyShifts} frequency shift${summary.frequencyShifts === 1 ? '' : 's'}`);
    }

    // If no changes at all
    if (summary.appeared === 0 && summary.disappeared === 0 &&
        summary.severityShifts === 0 && summary.frequencyShifts === 0) {
        lines.push('- No changes detected');
    }

    return lines.join('\n');
}

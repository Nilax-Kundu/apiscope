/**
 * Continuity builder
 * Generates signals for longitudinal silence (no changes)
 */

import { ContinuitySignal, ChangeEvent } from '../types.js';

/**
 * Build continuity signal based on recent history
 * 
 * Rules:
 * - Affirm continuity if multiple runs compared
 * - Contextualize silence
 * - No authority
 */
export function buildContinuitySignal(
    comparedRunsCount: number,
    changes: ChangeEvent[],
    totalFindingsCount: number
): ContinuitySignal | undefined {
    // If we haven't compared any runs, no continuity logic applies
    if (comparedRunsCount === 0) {
        return undefined;
    }

    // Identify "significant" changes (severity/confidence shifts, new findings)
    // We treat all changes as potentially significant, but continuity
    // is about emphasizing STABILITY.

    const significantChanges = changes.length;

    // Unchanged findings = Total - Changed
    // NOTE: This is a simplification. Changed findings are usually a subset of total.
    // Ideally we count findings that exist in both and didn't have a change event.
    const unchangedCount = Math.max(0, totalFindingsCount - significantChanges);

    // Only generate signal if changes are minimal (e.g. < 20% of findings changed)
    // OR if there are NO changes at all.

    if (significantChanges === 0) {
        return {
            comparedRuns: comparedRunsCount,
            unchangedFindings: unchangedCount,
            message: `No changes detected across the last ${comparedRunsCount} runs.`
        };
    }

    // If there ARE changes, we might still report continuity if it's high
    // e.g. "98% of findings remained stable"
    // But V2 spec focuses on "Longitudinal Silence Must Remain Visible"
    // So usually we output this when things are quiet.

    return undefined;
}

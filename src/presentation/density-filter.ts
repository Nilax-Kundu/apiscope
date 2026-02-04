/**
 * Evidence Density Controls for V3
 * Progressive disclosure of findings - clarification, not filtering
 */

import { DriftFinding } from '../types.js';

export type DensityMode = 'compact' | 'verbose';

/**
 * Output view with visibility tracking
 */
export interface OutputView {
    findings: DriftFinding[];
    hiddenCount: number;
}

/**
 * Apply density control to findings.
 * 
 * INVARIANT: Compact mode is progressive disclosure, not suppression.
 * Hidden count must always be visible to users.
 * 
 * @param findings - All drift findings
 * @param mode - Density mode ('compact' | 'verbose')
 * @returns OutputView with visible findings and hidden count
 */
export function applyDensityControl(
    findings: DriftFinding[],
    mode: DensityMode
): OutputView {
    if (mode === 'verbose') {
        return { findings, hiddenCount: 0 };
    }

    // Compact: show only high-severity findings with sufficient samples
    // Rule: Help users see less, not decide what's important
    const visible = findings.filter(f =>
        f.severity === 'high' && f.confidence.sampleCount >= 100
    );

    return {
        findings: visible,
        hiddenCount: findings.length - visible.length
    };
}

/**
 * Format density summary for display
 * 
 * LANGUAGE VIGILANCE POINT A:
 * ✅ Allowed: "Showing N of M", "less dense", "fewer findings"
 * ❌ Forbidden: "most important", "recommended", "key findings", "critical only"
 * 
 * Rule: Compact mode must feel like "less" not "better"
 */
export function formatDensitySummary(view: OutputView): string | null {
    if (view.hiddenCount === 0) {
        return null; // Verbose mode - no summary needed
    }

    const total = view.findings.length + view.hiddenCount;
    return `Showing ${view.findings.length} of ${total} findings (use --verbose to see all)`;
}

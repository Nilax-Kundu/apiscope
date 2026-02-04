/**
 * Trend builder
 * Orchestrates multiple analyzers to build TrendSummary objects
 */

import { DriftReportV2, TrendSummary, DriftFinding } from '../types.js';
import { createScope, scopeKey, groupByScope } from '../diff/finding-matcher.js';
import { calculateFrequencyBand } from './frequency-analyzer.js';
import { calculateConfidenceTrend, assessStability } from './confidence-analyzer.js';

/**
 * Build trends from historical reports
 * @param currentFindings Findings from the current run
 * @param historicalReports Previous reports (ordered newest to oldest, but we'll reverse for analysis)
 */
export function buildTrends(
    currentFindings: DriftFinding[],
    historicalReports: DriftReportV2[] // Expected: newest first
): TrendSummary[] {
    const trends: TrendSummary[] = [];

    // Process historical reports: oldest to newest including current
    const history = [...historicalReports].reverse();

    // Only analyze findings present in current run? 
    // V2 requirement: "Trends answer... How has this behaved over multiple runs?"
    // Usually we attach trends to current findings.

    for (const finding of currentFindings) {
        const scope = createScope(finding);
        const sKey = scopeKey(scope);

        // Extract history for this specific finding scope
        const sampleCounts: number[] = [];
        const percentages: number[] = [];
        const presenceHistory: boolean[] = [];

        // Collect history
        for (const report of history) {
            const olderFindings = groupByScope(report.report.findings);
            const historicalFinding = olderFindings.get(sKey);

            presenceHistory.push(!!historicalFinding);

            if (historicalFinding) {
                sampleCounts.push(historicalFinding.confidence.sampleCount);
                percentages.push(historicalFinding.observed.percentage || 0);
            } else {
                sampleCounts.push(0);
                percentages.push(0);
            }
        }

        // Add current values
        presenceHistory.push(true); // By definition, it's in currentFindings
        sampleCounts.push(finding.confidence.sampleCount);
        percentages.push(finding.observed.percentage || 0);

        // Calculate metrics
        // Filter out zeros for averages if we want "average when present", but usually we want overall behavior
        // For frequency band, let's use average of non-zero to be fairer to "intermittent" vs "rare"
        const nonZeroPercentages = percentages.filter(p => p > 0);
        const avgPercentage = nonZeroPercentages.length > 0
            ? nonZeroPercentages.reduce((a, b) => a + b, 0) / nonZeroPercentages.length
            : 0;

        const frequencyBand = calculateFrequencyBand(avgPercentage);

        // Confidence trend uses raw sample counts (including zeros if missing)
        const confidenceTrend = calculateConfidenceTrend(sampleCounts);

        // Stability uses presence boolean history
        const stability = assessStability(presenceHistory);

        trends.push({
            scope,
            observationCount: history.length + 1, // +1 for current
            frequencyBand,
            confidenceTrend,
            stability
        });
    }

    return trends;
}

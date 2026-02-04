/**
 * Change detector
 * Generates ChangeEvents from report-to-report differences
 * 
 * INVARIANT: Changes are evidence, not verdicts
 * INVARIANT: No causal language (no "regression", "fix", "improvement")
 */

import { randomUUID } from 'crypto';
import { DriftReport, ChangeEvent, ChangeSnapshot } from '../types.js';
import { createScope, groupByScope } from './finding-matcher.js';

/**
 * Detect changes between two reports
 */
export function detectChanges(
    previousReport: DriftReport,
    currentReport: DriftReport
): ChangeEvent[] {
    const changes: ChangeEvent[] = [];

    const prevMap = groupByScope(previousReport.findings);
    const currMap = groupByScope(currentReport.findings);

    // Track all scopes
    const allScopes = new Set([...prevMap.keys(), ...currMap.keys()]);

    for (const scopeKeyStr of allScopes) {
        const prevFinding = prevMap.get(scopeKeyStr);
        const currFinding = currMap.get(scopeKeyStr);

        // Finding appeared
        if (!prevFinding && currFinding) {
            changes.push({
                changeId: randomUUID(),
                changeType: 'finding_appeared',
                scope: createScope(currFinding),
                current: createSnapshot(currFinding),
            });
            continue;
        }

        // Finding disappeared
        if (prevFinding && !currFinding) {
            changes.push({
                changeId: randomUUID(),
                changeType: 'finding_disappeared',
                scope: createScope(prevFinding),
                previous: createSnapshot(prevFinding),
            });
            continue;
        }

        // Both exist - check for shifts
        if (prevFinding && currFinding) {
            const scope = createScope(currFinding);

            // Severity shift
            if (prevFinding.severity !== currFinding.severity) {
                changes.push({
                    changeId: randomUUID(),
                    changeType: 'severity_shift',
                    scope,
                    previous: { severity: prevFinding.severity },
                    current: { severity: currFinding.severity },
                });
            }

            // Frequency shift (>10% change)
            const prevFreq = prevFinding.observed.percentage || 0;
            const currFreq = currFinding.observed.percentage || 0;
            if (Math.abs(currFreq - prevFreq) > 10) {
                changes.push({
                    changeId: randomUUID(),
                    changeType: 'frequency_shift',
                    scope,
                    previous: { frequencyPercentage: prevFreq },
                    current: { frequencyPercentage: currFreq },
                });
            }

            // Confidence shift (sample count changed >50%)
            const prevSampleCount = prevFinding.confidence.sampleCount;
            const currSampleCount = currFinding.confidence.sampleCount;
            const changePercent = Math.abs(currSampleCount - prevSampleCount) / prevSampleCount * 100;

            if (changePercent > 50) {
                changes.push({
                    changeId: randomUUID(),
                    changeType: 'confidence_shift',
                    scope,
                    previous: {
                        sampleCount: prevSampleCount,
                        confidenceInputs: prevFinding.confidence,
                    },
                    current: {
                        sampleCount: currSampleCount,
                        confidenceInputs: currFinding.confidence,
                    },
                });
            }
        }
    }

    return changes;
}

/**
 * Create a change snapshot from a finding (partial data only)
 */
function createSnapshot(finding: any): ChangeSnapshot {
    return {
        severity: finding.severity,
        frequencyPercentage: finding.observed.percentage,
        sampleCount: finding.confidence.sampleCount,
        confidenceInputs: finding.confidence,
    };
}

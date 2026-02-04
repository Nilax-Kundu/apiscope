/**
 * Structural Grouping for V3
 * Group findings by scope to reduce scanning cost
 * 
 * INVARIANT: Grouping is not prioritization
 */

import { DriftFinding } from '../types.js';

export type GroupBy = 'endpoint' | 'field' | 'status' | 'none';

/**
 * Group findings by specified dimension
 * 
 * @param findings - Drift findings to group
 * @param groupBy - Grouping dimension
 * @returns Map of group keys to findings
 */
export function groupFindings(
    findings: DriftFinding[],
    groupBy: GroupBy
): Map<string, DriftFinding[]> {
    if (groupBy === 'none') {
        return new Map([['all', findings]]);
    }

    const groups = new Map<string, DriftFinding[]>();

    for (const finding of findings) {
        const key = getGroupKey(finding, groupBy);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(finding);
    }

    return groups;
}

/**
 * Determine group key for a finding
 * 
 * INVARIANT: Keys are descriptive labels, not priorities
 */
function getGroupKey(finding: DriftFinding, groupBy: GroupBy): string {
    switch (groupBy) {
        case 'endpoint':
            return `${finding.method} ${finding.path}`;
        case 'field':
            return finding.fieldPath || 'status-code';
        case 'status':
            return `${finding.statusCode || 'field'}`;
        default:
            return 'all';
    }
}

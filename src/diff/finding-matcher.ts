/**
 * Finding matcher
 * Matches findings across runs by scope
 */

import { DriftFinding, FindingScope } from '../types.js';

/**
 * Create FindingScope from DriftFinding
 */
export function createScope(finding: DriftFinding): FindingScope {
    return {
        method: finding.method,
        path: finding.path,
        fieldPath: finding.fieldPath,
        statusCode: finding.statusCode,
    };
}

/**
 * Compare two scopes for equality
 */
export function scopesEqual(a: FindingScope, b: FindingScope): boolean {
    return (
        a.method === b.method &&
        a.path === b.path &&
        a.fieldPath === b.fieldPath &&
        a.statusCode === b.statusCode
    );
}

/**
 * Create a scope key for Map lookups
 */
export function scopeKey(scope: FindingScope): string {
    const parts = [scope.method, scope.path];
    if (scope.fieldPath) parts.push(`field:${scope.fieldPath}`);
    if (scope.statusCode) parts.push(`status:${scope.statusCode}`);
    return parts.join('|');
}

/**
 * Group findings by scope
 */
export function groupByScope(findings: DriftFinding[]): Map<string, DriftFinding> {
    const map = new Map<string, DriftFinding>();
    for (const finding of findings) {
        const scope = createScope(finding);
        const key = scopeKey(scope);
        map.set(key, finding);
    }
    return map;
}

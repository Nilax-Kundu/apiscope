/**
 * Unit tests for density-filter.ts
 */

import { applyDensityControl, formatDensitySummary } from './density-filter.js';
import { DriftFinding } from '../types.js';

const createFinding = (severity: 'high' | 'medium' | 'low', sampleCount: number): DriftFinding => ({
    type: 'undocumented-field',
    method: 'GET',
    path: '/test',
    fieldPath: 'test.field',
    observed: { count: sampleCount },
    confidence: {
        sampleCount,
        consistencyPercentage: 80,
        windowDurationMs: 1000
    },
    severity,
    window: {
        startTime: '2024-01-01T00:00:00Z',
        endTime: '2024-01-01T01:00:00Z',
        sampleCount
    }
});

describe('density-filter', () => {
    describe('applyDensityControl', () => {
        it('should show all findings in verbose mode', () => {
            const findings = [
                createFinding('high', 150),
                createFinding('medium', 100),
                createFinding('low', 50)
            ];

            const result = applyDensityControl(findings, 'verbose');

            expect(result.findings.length).toBe(3);
            expect(result.hiddenCount).toBe(0);
        });

        it('should filter to high-severity + high-confidence in compact mode', () => {
            const findings = [
                createFinding('high', 150),  // Should be visible
                createFinding('high', 50),   // Hidden: too few samples
                createFinding('medium', 150), // Hidden: not high severity
                createFinding('low', 200)    // Hidden: not high severity
            ];

            const result = applyDensityControl(findings, 'compact');

            expect(result.findings.length).toBe(1);
            expect(result.hiddenCount).toBe(3);
            expect(result.findings[0].severity).toBe('high');
        });
    });

    describe('formatDensitySummary', () => {
        it('should return null for verbose mode (no hidden findings)', () => {
            const view = {
                findings: [createFinding('high', 100)],
                hiddenCount: 0
            };

            const result = formatDensitySummary(view);

            expect(result).toBeNull();
        });

        it('should format summary with hidden count', () => {
            const view = {
                findings: [createFinding('high', 100)],
                hiddenCount: 5
            };

            const result = formatDensitySummary(view);

            expect(result).toBe('Showing 1 of 6 findings (use --verbose to see all)');
        });

        it('should pluralize "findings" correctly', () => {
            const view = {
                findings: [
                    createFinding('high', 100),
                    createFinding('high', 150)
                ],
                hiddenCount: 3
            };

            const result = formatDensitySummary(view);

            expect(result).toBe('Showing 2 of 5 findings (use --verbose to see all)');
        });
    });
});

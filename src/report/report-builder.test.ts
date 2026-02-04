/**
 * Tests for report-builder
 */

import { buildDriftReport } from './report-builder.js';
import { DriftFinding, ObservationWindow } from '../types.js';

const mockWindow: ObservationWindow = {
    startTime: '2026-02-03T10:00:00Z',
    endTime: '2026-02-03T11:00:00Z',
    sampleCount: 100,
};

const mockFindings: DriftFinding[] = [
    {
        type: 'undocumented-field',
        method: 'GET',
        path: '/api/test',
        fieldPath: 'field1',
        observed: { percentage: 90 },
        confidence: {
            sampleCount: 90,
            consistencyPercentage: 90,
            windowDurationMs: 3600000,
        },
        severity: 'high',
        window: mockWindow,
    },
    {
        type: 'undocumented-field',
        method: 'GET',
        path: '/api/test',
        fieldPath: 'field2',
        observed: { percentage: 5 },
        confidence: {
            sampleCount: 2,
            consistencyPercentage: 5,
            windowDurationMs: 3600000,
        },
        severity: 'low',
        window: mockWindow,
    },
    {
        type: 'type-mismatch',
        method: 'POST',
        path: '/api/test',
        fieldPath: 'field3',
        observed: { percentage: 50 },
        confidence: {
            sampleCount: 50,
            consistencyPercentage: 50,
            windowDurationMs: 3600000,
        },
        severity: 'medium',
        window: mockWindow,
    },
];

describe('buildDriftReport', () => {
    it('should apply default filter', () => {
        const report = buildDriftReport(mockFindings, mockWindow, 3, true);

        expect(report.filtered).toBe(true);
        expect(report.findings.length).toBeLessThan(mockFindings.length);
        // Low severity finding should be filtered out
        expect(report.findings.find(f => f.severity === 'low')).toBeUndefined();
    });

    it('should not filter when disabled', () => {
        const report = buildDriftReport(mockFindings, mockWindow, 3, false);

        expect(report.filtered).toBe(false);
        expect(report.findings).toHaveLength(mockFindings.length);
    });

    it('should sort by severity then sample count', () => {
        const report = buildDriftReport(mockFindings, mockWindow, 3, false);

        expect(report.findings[0].severity).toBe('high');
        // If same severity, higher sample count comes first
    });

    it('should include window and endpoint metadata', () => {
        const report = buildDriftReport(mockFindings, mockWindow, 3);

        expect(report.window).toEqual(mockWindow);
        expect(report.endpointsAnalyzed).toBe(3);
    });
});

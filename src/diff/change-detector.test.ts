import { detectChanges } from './change-detector.js';
import { DriftReport, DriftFinding } from '../types.js';

describe('detectChanges', () => {
    // Helper to create a minimal report
    const createReport = (findings: DriftFinding[]): DriftReport => ({
        window: { startTime: '2023-01-01', endTime: '2023-01-02', sampleCount: 100 },
        endpointsAnalyzed: 1,
        findings,
        filtered: false
    });

    const createFinding = (id: string, severity: 'high' | 'medium' | 'low' = 'high'): DriftFinding => ({
        type: 'undocumented-field',
        method: 'GET',
        path: '/test',
        fieldPath: id,
        severity,
        confidence: { sampleCount: 100, consistencyPercentage: 100, windowDurationMs: 1000 },
        observed: { percentage: 100, count: 100 },
        window: { startTime: '2023-01-01', endTime: '2023-01-02', sampleCount: 100 }
    });

    it('should detect new findings', () => {
        const prev = createReport([]);
        const curr = createReport([createFinding('field1')]);

        const changes = detectChanges(prev, curr);

        expect(changes).toHaveLength(1);
        expect(changes[0].changeType).toBe('finding_appeared');
        expect(changes[0].scope.fieldPath).toBe('field1');
    });

    it('should detect removed findings', () => {
        const prev = createReport([createFinding('field1')]);
        const curr = createReport([]);

        const changes = detectChanges(prev, curr);

        expect(changes).toHaveLength(1);
        expect(changes[0].changeType).toBe('finding_disappeared');
    });

    it('should detect severity shifts', () => {
        const prev = createReport([createFinding('field1', 'high')]);
        const curr = createReport([createFinding('field1', 'medium')]);

        const changes = detectChanges(prev, curr);

        expect(changes).toHaveLength(1);
        expect(changes[0].changeType).toBe('severity_shift');
        expect(changes[0].previous?.severity).toBe('high');
        expect(changes[0].current?.severity).toBe('medium');
    });

    it('should detect frequency shifts > 10%', () => {
        const f1 = createFinding('field1');
        f1.observed.percentage = 20;

        const f2 = createFinding('field1');
        f2.observed.percentage = 80;

        const prev = createReport([f1]);
        const curr = createReport([f2]);

        const changes = detectChanges(prev, curr);

        expect(changes).toHaveLength(1);
        expect(changes[0].changeType).toBe('frequency_shift');
        expect(changes[0].previous?.frequencyPercentage).toBe(20);
        expect(changes[0].current?.frequencyPercentage).toBe(80);
    });

    it('should ignore small frequency shifts <= 10%', () => {
        const f1 = createFinding('field1');
        f1.observed.percentage = 20;

        const f2 = createFinding('field1');
        f2.observed.percentage = 25;

        const prev = createReport([f1]);
        const curr = createReport([f2]);

        const changes = detectChanges(prev, curr);

        expect(changes).toHaveLength(0);
    });
});

import { buildContinuitySignal } from './continuity-builder.js';
import { ChangeEvent } from '../types.js';

describe('Continuity Builder', () => {
    it('should return undefined if no runs compared', () => {
        const signal = buildContinuitySignal(0, [], 10);
        expect(signal).toBeUndefined();
    });

    it('should return undefined if significant changes exist', () => {
        const changes = [{
            changeId: '1',
            changeType: 'finding_appeared',
            scope: { method: 'GET', path: '/test' }
        } as ChangeEvent];
        const signal = buildContinuitySignal(2, changes, 10);
        expect(signal).toBeUndefined();
    });

    it('should build signal when no changes detected', () => {
        const signal = buildContinuitySignal(2, [], 10);

        expect(signal).toBeDefined();
        expect(signal?.comparedRuns).toBe(2);
        expect(signal?.unchangedFindings).toBe(10);
        expect(signal?.message).toContain('No changes detected');
    });
});

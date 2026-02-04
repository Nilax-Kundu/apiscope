/**
 * Unit tests for delta-summary.ts
 */

import { buildDeltaSummary, formatDeltaSummary } from './delta-summary.js';
import { ChangeEvent } from '../types.js';

const createChange = (changeType: ChangeEvent['changeType']): ChangeEvent => ({
    changeId: 'test-id',
    changeType,
    scope: {
        method: 'GET',
        path: '/test'
    }
});

describe('delta-summary', () => {
    describe('buildDeltaSummary', () => {
        it('should count changes by type', () => {
            const changes: ChangeEvent[] = [
                createChange('finding_appeared'),
                createChange('finding_appeared'),
                createChange('finding_disappeared'),
                createChange('severity_shift'),
                createChange('frequency_shift'),
                createChange('frequency_shift')
            ];

            const result = buildDeltaSummary(changes);

            expect(result.appeared).toBe(2);
            expect(result.disappeared).toBe(1);
            expect(result.severityShifts).toBe(1);
            expect(result.frequencyShifts).toBe(2);
        });

        it('should handle empty changes array', () => {
            const result = buildDeltaSummary([]);

            expect(result.appeared).toBe(0);
            expect(result.disappeared).toBe(0);
            expect(result.severityShifts).toBe(0);
            expect(result.frequencyShifts).toBe(0);
        });
    });

    describe('formatDeltaSummary', () => {
        it('should format summary with all change types', () => {
            const summary = {
                appeared: 2,
                disappeared: 1,
                severityShifts: 1,
                frequencyShifts: 3
            };

            const result = formatDeltaSummary(summary);

            expect(result).toContain('Since last run:');
            expect(result).toContain('2 findings appeared');
            expect(result).toContain('1 finding disappeared');
            expect(result).toContain('1 severity shift');
            expect(result).toContain('3 frequency shifts');
        });

        it('should handle singular vs plural correctly', () => {
            const summary = {
                appeared: 1,
                disappeared: 1,
                severityShifts: 1,
                frequencyShifts: 1
            };

            const result = formatDeltaSummary(summary);

            expect(result).toContain('1 finding appeared');
            expect(result).toContain('1 finding disappeared');
            expect(result).toContain('1 severity shift');
            expect(result).toContain('1 frequency shift');
        });

        it('should show "No changes detected" when all counts are zero', () => {
            const summary = {
                appeared: 0,
                disappeared: 0,
                severityShifts: 0,
                frequencyShifts: 0
            };

            const result = formatDeltaSummary(summary);

            expect(result).toContain('Since last run:');
            expect(result).toContain('No changes detected');
        });

        it('should be quantitative only (no judgment)', () => {
            const forbiddenWords = ['good', 'bad', 'better', 'worse', 'concerning', 'improved'];

            const summary = {
                appeared: 5,
                disappeared: 3,
                severityShifts: 2,
                frequencyShifts: 1
            };

            const result = formatDeltaSummary(summary);

            for (const word of forbiddenWords) {
                expect(result.toLowerCase()).not.toContain(word);
            }
        });
    });
});

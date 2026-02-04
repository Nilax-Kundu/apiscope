/**
 * Tests for empty-state
 */

import { createEmptyReport } from './empty-state.js';
import { ObservationWindow } from '../types.js';

describe('createEmptyReport', () => {
    it('should create affirmative empty state', () => {
        const window: ObservationWindow = {
            startTime: '2026-02-03T10:00:00Z',
            endTime: '2026-02-03T11:00:00Z',
            sampleCount: 100,
        };

        const report = createEmptyReport(window, 5);

        expect(report.observationComplete).toBe(true);
        expect(report.findings).toHaveLength(0);
        expect(report.window).toEqual(window);
        expect(report.endpointsAnalyzed).toBe(5);
    });

    it('should include filter metadata', () => {
        const window: ObservationWindow = {
            startTime: '2026-02-03T10:00:00Z',
            endTime: '2026-02-03T11:00:00Z',
            sampleCount: 50,
        };

        const report = createEmptyReport(window, 2);

        expect(report.filtered).toBe(true);
        expect(report.filterCriteria).toBeDefined();
    });
});

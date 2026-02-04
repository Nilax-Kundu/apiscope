/**
 * Unit tests for trend-viz.ts
 */

import { renderFrequencyTrend, describeTrend } from './trend-viz.js';

describe('trend-viz', () => {
    describe('renderFrequencyTrend', () => {
        it('should render empty string for empty array', () => {
            const result = renderFrequencyTrend([]);
            expect(result).toBe('');
        });

        it('should map percentages to correct blocks', () => {
            // The blocks are: ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█']
            // Mapping: 0-12.4 → ▁, 12.5-24.9 → ▂, 25-37.4 → ▃, 37.5-49.9 → ▄, 
            //          50-62.4 → ▅, 62.5-74.9 → ▆, 75-87.4 → ▇, 87.5-100 → █
            const percentages = [0, 25, 50, 75, 100];
            const result = renderFrequencyTrend(percentages);

            // 0 → index 0 (▁), 25 → index 2 (▃), 50 → index 4 (▅), 
            // 75 → index 6 (▇), 100 → index 8 but capped at 7 (█)
            expect(result).toBe('▁▃▅▇█');
        });

        it('should handle edge cases', () => {
            const percentages = [0, 12.4, 12.5, 99.9, 100];
            const result = renderFrequencyTrend(percentages);

            // 0 → ▁, 12.4 → ▁, 12.5 → ▂, 99.9 → █, 100 → █
            expect(result).toBe('▁▁▂██');
        });
    });

    describe('describeTrend', () => {
        it('should return "insufficient history" for < 3 data points', () => {
            expect(describeTrend([])).toBe('insufficient history');
            expect(describeTrend([50])).toBe('insufficient history');
            expect(describeTrend([50, 60])).toBe('insufficient history');
        });

        it('should detect increasing trend', () => {
            // Older: [10, 20], Recent: [40, 50, 60]
            // recentAvg = 50, olderAvg = 15
            // 50 > 15 * 1.5 (22.5) → increasing
            const percentages = [10, 20, 40, 50, 60];
            const result = describeTrend(percentages);

            expect(result).toBe('increasing over last 3 runs');
        });

        it('should detect decreasing trend', () => {
            // Older: [80, 90], Recent: [30, 40, 50]
            // recentAvg = 40, olderAvg = 85
            // 40 < 85 * 0.67 (56.95) → decreasing
            const percentages = [80, 90, 30, 40, 50];
            const result = describeTrend(percentages);

            expect(result).toBe('decreasing over last 3 runs');
        });

        it('should detect stable trend', () => {
            // Older: [45, 50], Recent: [48, 52, 50]
            // recentAvg = 50, olderAvg = 47.5
            // Neither > 1.5x nor < 0.67x → stable
            const percentages = [45, 50, 48, 52, 50];
            const result = describeTrend(percentages);

            expect(result).toBe('stable over recent runs');
        });

        it('should use only comparative language (no adjectives)', () => {
            // Verify no forbidden words appear
            const forbiddenWords = ['rapidly', 'sharp', 'worsening', 'improving', 'concerning', 'dramatic'];

            const testCases = [
                [10, 20, 80, 90, 95],  // Increasing
                [90, 80, 30, 20, 10],  // Decreasing
                [50, 50, 50, 50, 50]   // Stable
            ];

            for (const percentages of testCases) {
                const result = describeTrend(percentages);
                for (const word of forbiddenWords) {
                    expect(result.toLowerCase()).not.toContain(word);
                }
            }
        });
    });
});

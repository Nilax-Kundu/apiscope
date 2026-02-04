/**
 * Temporal Micro-Visualization for V3
 * Textual trend indicators without numerical precision
 * 
 * INVARIANT: Describes shape, not cause
 */

/**
 * Render frequency trend as ASCII blocks
 * Maps percentages to visual representation: ▁▂▃▄▅▆▇█
 * 
 * @param percentages - Array of percentage values (0-100)
 * @returns ASCII block representation
 */
export function renderFrequencyTrend(percentages: number[]): string {
    if (percentages.length === 0) {
        return '';
    }

    // ASCII blocks from lowest to highest
    const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

    return percentages.map(p => {
        // Map 0-100 to 0-7 (8 blocks)
        const index = Math.min(Math.floor(p / 12.5), 7);
        return blocks[index];
    }).join('');
}

/**
 * Describe trend pattern in words
 * 
 * LANGUAGE VIGILANCE POINT B - Trend Description:
 * ✅ Allowed: "increasing", "decreasing", "stable", "over last N runs"
 * ❌ Forbidden: "rapidly", "sharp", "worsening", "improving", "concerning", "dramatic"
 * 
 * Rule: Comparative only, never directional. No adjectives.
 * Test: If it could appear in a postmortem slide, it's too strong.
 * 
 * @param percentages - Array of percentage values
 * @returns Textual trend description
 */
export function describeTrend(percentages: number[]): string {
    if (percentages.length < 3) {
        return 'insufficient history';
    }

    const recent = percentages.slice(-3);
    const older = percentages.slice(0, -3);

    if (older.length === 0) {
        return 'insufficient history';
    }

    const recentAvg = recent.reduce((a, b) => a + b) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b) / older.length;

    // Simple comparative thresholds - no judgment about rate of change
    if (recentAvg > olderAvg * 1.5) {
        return 'increasing over last 3 runs';
    }
    if (recentAvg < olderAvg * 0.67) {
        return 'decreasing over last 3 runs';
    }
    return 'stable over recent runs';
}

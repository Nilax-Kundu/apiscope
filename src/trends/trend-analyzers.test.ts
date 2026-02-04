import { calculateFrequencyBand } from './frequency-analyzer.js';
import { calculateConfidenceTrend, assessStability } from './confidence-analyzer.js';

describe('Frequency Analyzer', () => {
    it('should categorize bands correctly', () => {
        expect(calculateFrequencyBand(5)).toBe('rare');
        expect(calculateFrequencyBand(15)).toBe('intermittent');
        expect(calculateFrequencyBand(50)).toBe('common');
        expect(calculateFrequencyBand(90)).toBe('dominant');
    });
});

describe('Confidence Analyzer', () => {
    it('should detect insufficient data', () => {
        expect(calculateConfidenceTrend([10, 20])).toBe('insufficient_data');
    });

    it('should detect strengthening trend', () => {
        expect(calculateConfidenceTrend([10, 20, 30, 40])).toBe('strengthening');
    });

    it('should detect weakening trend', () => {
        expect(calculateConfidenceTrend([40, 30, 20, 10])).toBe('weakening');
    });

    it('should detect stable trend (low variance)', () => {
        expect(calculateConfidenceTrend([100, 105, 95, 102])).toBe('stable');
    });
});

describe('Stability Analyzer', () => {
    it('should detect emerging (insufficient runs)', () => {
        expect(assessStability([true, true])).toBe('emerging');
    });

    it('should detect stable (high presence)', () => {
        expect(assessStability([true, true, true, true, true, false])).toBe('stable'); // 83% presence
    });

    it('should detect volatile (mixed presence)', () => {
        expect(assessStability([true, false, true, false, true])).toBe('volatile');
    });

    it('should detect emerging (recent appearance)', () => {
        // Not present for a long time, then present recently
        const history = [false, false, false, false, true, true];
        expect(assessStability(history)).toBe('emerging');
    });
});

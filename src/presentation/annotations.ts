/**
 * Inline Documentation for V3
 * Static annotations explaining design constraints
 * 
 * INVARIANT: Educates without concluding
 */

/**
 * Design notes to reduce "why doesn't it do X?" frustration
 * These are static explanations, not dynamic conclusions
 */
export const DESIGN_NOTES = {
    confidence: '(confidence scores are not calculated by design)',
    severity: '(severity reflects data patterns, not business impact)',
    trends: '(trends describe observed patterns, not causes)',
} as const;

/**
 * Get design note for a specific concept
 */
export function getDesignNote(concept: keyof typeof DESIGN_NOTES): string {
    return DESIGN_NOTES[concept];
}

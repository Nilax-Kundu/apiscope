/**
 * Tests for schema-comparator
 */

import { compareFields, typesMatch } from './schema-comparator.js';
import { FieldObservation } from '../types.js';

describe('compareFields', () => {
    it('should detect undocumented fields', () => {
        const schema = {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
        };

        const observed: FieldObservation[] = [
            {
                path: 'id',
                occurrenceCount: 10,
                occurrencePercentage: 100,
                observedTypes: ['number'],
                sampleValues: [1, 2, 3],
            },
            {
                path: 'name',
                occurrenceCount: 10,
                occurrencePercentage: 100,
                observedTypes: ['string'],
                sampleValues: ['Alice', 'Bob'],
            },
            {
                path: 'email', // Not in spec
                occurrenceCount: 8,
                occurrencePercentage: 80,
                observedTypes: ['string'],
                sampleValues: ['alice@example.com'],
            },
        ];

        const comparisons = compareFields(schema, observed);

        const emailComp = comparisons.find(c => c.fieldPath === 'email');
        expect(emailComp).toBeDefined();
        expect(emailComp?.inSpec).toBe(false);
        expect(emailComp?.inObserved).toBe(true);
    });

    it('should detect missing required fields', () => {
        const schema = {
            type: 'object',
            properties: {
                id: { type: 'number' },
                name: { type: 'string' },
            },
            required: ['id', 'name'],
        };

        const observed: FieldObservation[] = [
            {
                path: 'id',
                occurrenceCount: 10,
                occurrencePercentage: 100,
                observedTypes: ['number'],
                sampleValues: [1, 2, 3],
            },
            // 'name' rarely observed
        ];

        const comparisons = compareFields(schema, observed);

        const nameComp = comparisons.find(c => c.fieldPath === 'name');
        expect(nameComp).toBeDefined();
        expect(nameComp?.inSpec).toBe(true);
        expect(nameComp?.specRequired).toBe(true);
        expect(nameComp?.inObserved).toBe(false);
    });

    it('should handle nested objects', () => {
        const schema = {
            type: 'object',
            properties: {
                user: {
                    type: 'object',
                    properties: {
                        name: { type: 'string' },
                    },
                },
            },
        };

        const observed: FieldObservation[] = [
            {
                path: 'user',
                occurrenceCount: 10,
                occurrencePercentage: 100,
                observedTypes: ['object'],
                sampleValues: [],
            },
            {
                path: 'user.name',
                occurrenceCount: 10,
                occurrencePercentage: 100,
                observedTypes: ['string'],
                sampleValues: ['Alice'],
            },
        ];

        const comparisons = compareFields(schema, observed);

        expect(comparisons.find(c => c.fieldPath === 'user')).toBeDefined();
        expect(comparisons.find(c => c.fieldPath === 'user.name')).toBeDefined();
    });
});

describe('typesMatch', () => {
    it('should match identical types', () => {
        expect(typesMatch(['string'], ['string'])).toBe(true);
    });

    it('should normalize integer to number', () => {
        expect(typesMatch(['integer'], ['number'])).toBe(true);
    });

    it('should detect type mismatches', () => {
        expect(typesMatch(['string'], ['number'])).toBe(false);
    });

    it('should handle multiple types with overlap', () => {
        expect(typesMatch(['string', 'number'], ['string'])).toBe(true);
    });

    it('should handle null in observed types', () => {
        expect(typesMatch(['string'], ['string', 'null'])).toBe(true);
    });
});

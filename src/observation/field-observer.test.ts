/**
 * Tests for field-observer
 */

import { FieldObserver } from './field-observer.js';

describe('FieldObserver', () => {
    it('should track field occurrence counts', () => {
        const observer = new FieldObserver();

        observer.observeBody({ name: 'Alice', age: 30 });
        observer.observeBody({ name: 'Bob' });
        observer.observeBody({ name: 'Charlie', age: 25 });

        const observations = observer.getObservations();

        const nameObs = observations.find(o => o.path === 'name');
        const ageObs = observations.find(o => o.path === 'age');

        expect(nameObs?.occurrenceCount).toBe(3);
        expect(nameObs?.occurrencePercentage).toBe(100);

        expect(ageObs?.occurrenceCount).toBe(2);
        expect(ageObs?.occurrencePercentage).toBeCloseTo(66.67, 1);
    });

    it('should track observed types', () => {
        const observer = new FieldObserver();

        observer.observeBody({ value: 'string' });
        observer.observeBody({ value: 123 });
        observer.observeBody({ value: null });

        const observations = observer.getObservations();
        const valueObs = observations.find(o => o.path === 'value');

        expect(valueObs?.observedTypes).toEqual(['null', 'number', 'string']);
    });

    it('should handle nested objects', () => {
        const observer = new FieldObserver();

        observer.observeBody({
            user: {
                name: 'Alice',
                email: 'alice@example.com',
            },
        });

        const observations = observer.getObservations();

        expect(observations.find(o => o.path === 'user')).toBeDefined();
        expect(observations.find(o => o.path === 'user.name')).toBeDefined();
        expect(observations.find(o => o.path === 'user.email')).toBeDefined();
    });

    it('should handle arrays', () => {
        const observer = new FieldObserver();

        observer.observeBody({
            items: [
                { id: 1, name: 'Item 1' },
                { id: 2, name: 'Item 2' },
            ],
        });

        const observations = observer.getObservations();

        expect(observations.find(o => o.path === 'items')).toBeDefined();
        expect(observations.find(o => o.path === 'items[0]')).toBeDefined();
        expect(observations.find(o => o.path === 'items[0].id')).toBeDefined();
        expect(observations.find(o => o.path === 'items[0].name')).toBeDefined();
    });

    it('should limit sample values to maximum', () => {
        const observer = new FieldObserver();

        // Add more than MAX_SAMPLE_VALUES (10) unique values
        for (let i = 0; i < 15; i++) {
            observer.observeBody({ value: i });
        }

        const observations = observer.getObservations();
        const valueObs = observations.find(o => o.path === 'value');

        expect(valueObs?.sampleValues.length).toBeLessThanOrEqual(10);
    });

    it('should handle undefined/null bodies', () => {
        const observer = new FieldObserver();

        observer.observeBody(undefined);
        observer.observeBody(null);

        expect(observer.getTotalSamples()).toBe(2);
        expect(observer.getObservations()).toHaveLength(0);
    });
});

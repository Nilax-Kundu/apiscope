/**
 * Tests for endpoint-observer
 */

import { buildEndpointObservation } from './endpoint-observer.js';
import { TrafficSample } from '../types.js';

describe('buildEndpointObservation', () => {
    it('should aggregate field observations and status codes', () => {
        const samples: TrafficSample[] = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/users/123',
                statusCode: 200,
                responseBody: { id: 123, name: 'Alice' },
            },
            {
                timestamp: '2026-02-03T10:01:00Z',
                method: 'GET',
                path: '/api/users/123',
                statusCode: 200,
                responseBody: { id: 123, name: 'Alice', email: 'alice@example.com' },
            },
            {
                timestamp: '2026-02-03T10:02:00Z',
                method: 'GET',
                path: '/api/users/123',
                statusCode: 404,
                responseBody: { error: 'Not found' },
            },
        ];

        const window = {
            startTime: '2026-02-03T10:00:00Z',
            endTime: '2026-02-03T10:02:00Z',
            sampleCount: 3,
        };

        const observation = buildEndpointObservation('GET', '/api/users/123', samples, window);

        expect(observation.method).toBe('GET');
        expect(observation.path).toBe('/api/users/123');
        expect(observation.window).toEqual(window);

        // Check response fields
        const idField = observation.responseFields.find(f => f.path === 'id');
        const nameField = observation.responseFields.find(f => f.path === 'name');
        const emailField = observation.responseFields.find(f => f.path === 'email');
        const errorField = observation.responseFields.find(f => f.path === 'error');

        expect(idField?.occurrenceCount).toBe(2);
        expect(nameField?.occurrenceCount).toBe(2);
        expect(emailField?.occurrenceCount).toBe(1);
        expect(errorField?.occurrenceCount).toBe(1);

        // Check status codes
        expect(observation.statusCodes).toEqual({ 200: 2, 404: 1 });
    });

    it('should track request fields', () => {
        const samples: TrafficSample[] = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'POST',
                path: '/api/users',
                statusCode: 201,
                requestBody: { name: 'Alice', email: 'alice@example.com' },
                responseBody: { id: 123 },
            },
            {
                timestamp: '2026-02-03T10:01:00Z',
                method: 'POST',
                path: '/api/users',
                statusCode: 201,
                requestBody: { name: 'Bob' },
                responseBody: { id: 124 },
            },
        ];

        const window = {
            startTime: '2026-02-03T10:00:00Z',
            endTime: '2026-02-03T10:01:00Z',
            sampleCount: 2,
        };

        const observation = buildEndpointObservation('POST', '/api/users', samples, window);

        const nameField = observation.requestFields.find(f => f.path === 'name');
        const emailField = observation.requestFields.find(f => f.path === 'email');

        expect(nameField?.occurrenceCount).toBe(2);
        expect(emailField?.occurrenceCount).toBe(1);
        expect(emailField?.occurrencePercentage).toBe(50);
    });
});

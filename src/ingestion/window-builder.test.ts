/**
 * Tests for window-builder
 */

import { buildObservationWindow, groupByEndpoint, parseEndpointKey } from './window-builder.js';
import { TrafficSample } from '../types.js';

describe('buildObservationWindow', () => {
    it('should calculate correct time range', () => {
        const samples: TrafficSample[] = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
            },
            {
                timestamp: '2026-02-03T10:05:00Z',
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
            },
            {
                timestamp: '2026-02-03T10:02:30Z',
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
            },
        ];

        const window = buildObservationWindow(samples);

        expect(window.startTime).toBe('2026-02-03T10:00:00.000Z');
        expect(window.endTime).toBe('2026-02-03T10:05:00.000Z');
        expect(window.sampleCount).toBe(3);
    });

    it('should fail on empty samples', () => {
        expect(() => buildObservationWindow([])).toThrow('Cannot build observation window from empty samples');
    });
});

describe('groupByEndpoint', () => {
    it('should group samples by method and path', () => {
        const samples: TrafficSample[] = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/users',
                statusCode: 200,
            },
            {
                timestamp: '2026-02-03T10:01:00Z',
                method: 'POST',
                path: '/api/users',
                statusCode: 201,
            },
            {
                timestamp: '2026-02-03T10:02:00Z',
                method: 'GET',
                path: '/api/users',
                statusCode: 200,
            },
        ];

        const groups = groupByEndpoint(samples);

        expect(groups.size).toBe(2);
        expect(groups.get('GET /api/users')).toHaveLength(2);
        expect(groups.get('POST /api/users')).toHaveLength(1);
    });
});

describe('parseEndpointKey', () => {
    it('should parse method and path from key', () => {
        const result = parseEndpointKey('GET /api/users/123');

        expect(result.method).toBe('GET');
        expect(result.path).toBe('/api/users/123');
    });

    it('should handle paths with spaces', () => {
        const result = parseEndpointKey('POST /api/some path with spaces');

        expect(result.method).toBe('POST');
        expect(result.path).toBe('/api/some path with spaces');
    });
});

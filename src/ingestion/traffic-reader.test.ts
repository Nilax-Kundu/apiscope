/**
 * Tests for traffic-reader
 */

import { readTrafficSamples } from './traffic-reader.js';

describe('readTrafficSamples', () => {
    it('should parse valid traffic samples', () => {
        const samples = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/users/123',
                statusCode: 200,
                responseBody: { id: 123, name: 'Alice' },
            },
            {
                timestamp: '2026-02-03T10:01:00Z',
                method: 'POST',
                path: '/api/users',
                statusCode: 201,
                requestBody: { name: 'Bob' },
                responseBody: { id: 124, name: 'Bob' },
            },
        ];

        const result = readTrafficSamples(samples);

        expect(result).toHaveLength(2);
        expect(result[0].method).toBe('GET');
        expect(result[0].path).toBe('/api/users/123');
        expect(result[1].statusCode).toBe(201);
    });

    it('should parse JSON string input', () => {
        const json = JSON.stringify([
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
            },
        ]);

        const result = readTrafficSamples(json);
        expect(result).toHaveLength(1);
    });

    it('should fail on missing timestamp', () => {
        const samples = [
            {
                method: 'GET',
                path: '/api/test',
                statusCode: 200,
            },
        ];

        expect(() => readTrafficSamples(samples)).toThrow("missing or invalid 'timestamp' field");
    });

    it('should fail on invalid method', () => {
        const samples = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'INVALID',
                path: '/api/test',
                statusCode: 200,
            },
        ];

        expect(() => readTrafficSamples(samples)).toThrow("invalid 'method' field");
    });

    it('should fail on missing path', () => {
        const samples = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                statusCode: 200,
            },
        ];

        expect(() => readTrafficSamples(samples)).toThrow("missing or invalid 'path' field");
    });

    it('should fail on missing statusCode', () => {
        const samples = [
            {
                timestamp: '2026-02-03T10:00:00Z',
                method: 'GET',
                path: '/api/test',
            },
        ];

        expect(() => readTrafficSamples(samples)).toThrow("missing or invalid 'statusCode' field");
    });

    it('should fail on empty array', () => {
        expect(() => readTrafficSamples([])).toThrow('Traffic samples array is empty');
    });

    it('should fail on non-array input', () => {
        expect(() => readTrafficSamples({ not: 'array' } as any)).toThrow('Expected JSON array');
    });

    it('should fail on invalid JSON string', () => {
        expect(() => readTrafficSamples('not valid json')).toThrow('Failed to parse JSON');
    });
});

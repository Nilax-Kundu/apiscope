import { detectDrift } from './comparison/drift-detector.js';
import { PathMatcher } from './comparison/path-matcher.js';
import { buildObservationWindow, groupByEndpoint } from './ingestion/window-builder.js';
import { buildEndpointObservation } from './observation/endpoint-observer.js';
import { TrafficSample, DriftFinding, HttpMethod, SpecEndpoint } from './types.js';

/**
 * Helper to run the full analysis pipeline in-memory for testing
 */
function runAnalysis(specEndpoints: SpecEndpoint[], samples: TrafficSample[]): DriftFinding[] {
    const specMap = new Map(specEndpoints.map(e => [`${e.method} ${e.path}`, e]));
    const pathTemplates = Array.from(new Set(specEndpoints.map(e => e.path)));
    const pathMatcher = new PathMatcher(pathTemplates);
    const globalWindow = buildObservationWindow(samples);

    const endpointGroups = groupByEndpoint(samples, (method, path) => {
        if (specMap.has(`${method} ${path}`)) return path;
        return pathMatcher.match(path) || path;
    });

    const allFindings: DriftFinding[] = [];
    for (const [endpointKey, endpointSamples] of endpointGroups) {
        const parts = endpointKey.split(' ');
        const method = parts[0] as HttpMethod;
        const path = parts.slice(1).join(' ');

        const observation = buildEndpointObservation(method, path, endpointSamples, globalWindow);
        const specEndpoint = specMap.get(endpointKey);
        const findings = detectDrift(specEndpoint, observation);
        allFindings.push(...findings);
    }

    return allFindings;
}

describe('System Invariants', () => {
    const mockSpec: SpecEndpoint[] = [
        {
            method: 'GET',
            path: '/users/{id}',
            responses: {
                200: {
                    type: 'object',
                    properties: { id: { type: 'number' }, name: { type: 'string' } },
                    required: ['id']
                } as any
            }
        }
    ];

    const mockTraffic: TrafficSample[] = [
        { timestamp: '2026-03-09T10:00:00Z', method: 'GET', path: '/users/1', statusCode: 200, responseBody: { id: 1, name: 'Alice' } },
        { timestamp: '2026-03-09T10:01:00Z', method: 'GET', path: '/users/2', statusCode: 200, responseBody: { id: 2, name: 'Bob', extra: true } }
    ];

    it('1. Determinism: produces identical findings for identical inputs', () => {
        // Deep copy to ensure no shared state if any
        const traffic1 = JSON.parse(JSON.stringify(mockTraffic));
        const traffic2 = JSON.parse(JSON.stringify(mockTraffic));

        const findings1 = runAnalysis(mockSpec, traffic1);
        const findings2 = runAnalysis(mockSpec, traffic2);

        // Remove window/timestamps if they differ by ms (they shouldn't here)
        expect(findings1).toEqual(findings2);
    });

    it('2. Order Stability: produces stable finding ordering regardless of input sequence', () => {
        const shuffledTraffic = [...mockTraffic].reverse();

        const r1 = runAnalysis(mockSpec, mockTraffic);
        const r2 = runAnalysis(mockSpec, shuffledTraffic);

        // Sorting in detectDrift and FieldObserver should ensure this
        expect(r1).toEqual(r2);
    });

    it('3. Large Window Safety: handles large traffic windows safely', () => {
        const largeTraffic: TrafficSample[] = [];
        for (let i = 0; i < 10000; i++) {
            largeTraffic.push({
                timestamp: new Date(Date.now() + i * 1000).toISOString(),
                method: 'GET',
                path: `/users/${i}`,
                statusCode: 200,
                responseBody: { id: i, name: `User ${i}` }
            });
        }

        expect(() => runAnalysis(mockSpec, largeTraffic)).not.toThrow();
    });

    it('4. Schema Composition Stability: allOf merging produces same findings as flat schema', () => {
        const flatSpec: SpecEndpoint[] = [
            {
                method: 'GET',
                path: '/users',
                responses: {
                    200: {
                        type: 'object',
                        properties: { id: { type: 'number' }, name: { type: 'string' } },
                        required: ['id', 'name']
                    } as any
                }
            }
        ];

        const allOfSpec: SpecEndpoint[] = [
            {
                method: 'GET',
                path: '/users',
                responses: {
                    200: {
                        type: 'object',
                        allOf: [
                            { properties: { id: { type: 'number' } }, required: ['id'] },
                            { properties: { name: { type: 'string' } }, required: ['name'] }
                        ]
                    } as any
                }
            }
        ];

        const traffic: TrafficSample[] = [
            { timestamp: '2026-03-09T10:00:00Z', method: 'GET', path: '/users', statusCode: 200, responseBody: { id: 1, name: 'Alice' } }
        ];

        const findingsFlat = runAnalysis(flatSpec, traffic);
        const findingsAllOf = runAnalysis(allOfSpec, traffic);

        expect(findingsFlat).toEqual(findingsAllOf);
    });
});

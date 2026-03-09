import { detectDrift } from './comparison/drift-detector.js';
import { PathMatcher } from './comparison/path-matcher.js';
import { buildObservationWindow, groupByEndpoint } from './ingestion/window-builder.js';
import { FieldObserver } from './observation/field-observer.js';
import { SpecEndpoint, TrafficSample, EndpointObservation, ObservationWindow } from './types.js';

describe('apiscope v3.2 Features', () => {
    const mockWindow: ObservationWindow = {
        startTime: '2026-03-09T10:00:00Z',
        endTime: '2026-03-09T11:00:00Z',
        sampleCount: 10
    };

    describe('1. Undocumented Endpoint Detection', () => {
        it('should report undocumented-endpoint when spec is missing', () => {
            const observation: EndpointObservation = {
                method: 'POST',
                path: '/internal/reset',
                window: mockWindow,
                responseFields: [],
                requestFields: [],
                statusCodes: { 204: 14 }
            };

            const findings = detectDrift(undefined, observation);
            
            expect(findings).toHaveLength(1);
            expect(findings[0]).toMatchObject({
                type: 'undocumented-endpoint',
                method: 'POST',
                path: '/internal/reset',
                observed: { count: 10 } // from mockWindow.sampleCount in this test context
            });
        });
    });

    describe('2. allOf Schema Merging', () => {
        it('should merge properties from allOf recursively', () => {
            const spec: SpecEndpoint = {
                method: 'GET',
                path: '/users',
                responses: {
                    200: {
                        type: 'object',
                        allOf: [
                            { properties: { base: { type: 'string' } }, required: ['base'] },
                            { 
                                allOf: [
                                    { properties: { nested: { type: 'number' } } }
                                ],
                                properties: { middle: { type: 'boolean' } }
                            }
                        ],
                        properties: { root: { type: 'string' } }
                    }
                }
            };

            const observation: EndpointObservation = {
                method: 'GET',
                path: '/users',
                window: mockWindow,
                responseFields: [
                    { path: 'base', occurrenceCount: 10, occurrencePercentage: 100, observedTypes: ['string'], sampleValues: [] },
                    { path: 'middle', occurrenceCount: 10, occurrencePercentage: 100, observedTypes: ['boolean'], sampleValues: [] },
                    { path: 'nested', occurrenceCount: 10, occurrencePercentage: 100, observedTypes: ['number'], sampleValues: [] },
                    { path: 'root', occurrenceCount: 10, occurrencePercentage: 100, observedTypes: ['string'], sampleValues: [] }
                ],
                requestFields: [],
                statusCodes: { 200: 10 }
            };

            const findings = detectDrift(spec, observation);
            // If merging works, no "undocumented-field" findings should exist
            const undocumented = findings.filter(f => f.type === 'undocumented-field');
            expect(undocumented).toHaveLength(0);
        });
    });

    describe('3. Status-Code Completeness', () => {
        it('should report undocumented-status-code and missing-status-code', () => {
            const spec: SpecEndpoint = {
                method: 'GET',
                path: '/test',
                responses: {
                    200: { type: 'object' },
                    404: { type: 'object' }
                }
            };

            const observation: EndpointObservation = {
                method: 'GET',
                path: '/test',
                window: mockWindow,
                responseFields: [],
                requestFields: [],
                statusCodes: { 
                    200: 8,
                    500: 2 
                }
            };

            const findings = detectDrift(spec, observation);
            
            expect(findings.some(f => f.type === 'undocumented-status-code' && f.statusCode === 500)).toBe(true);
            expect(findings.some(f => f.type === 'missing-status-code' && f.statusCode === 404)).toBe(true);
        });

        it('should respect "default" schema and not report undocumented for unlisted codes', () => {
            const spec: SpecEndpoint = {
                method: 'GET',
                path: '/test',
                responses: {
                    200: { type: 'object' },
                    default: { type: 'object', properties: { error: { type: 'string' } } }
                }
            };

            const observation: EndpointObservation = {
                method: 'GET',
                path: '/test',
                window: mockWindow,
                responseFields: [
                    { path: 'error', occurrenceCount: 2, occurrencePercentage: 20, observedTypes: ['string'], sampleValues: [] }
                ],
                requestFields: [],
                statusCodes: { 
                    200: 8,
                    404: 2 
                }
            };

            const findings = detectDrift(spec, observation);
            
            // Should NOT have undocumented-status-code for 404
            expect(findings.some(f => f.type === 'undocumented-status-code')).toBe(false);
            // Should NOT have undocumented-field for 'error' because it's in default
            expect(findings.some(f => f.type === 'undocumented-field' && f.fieldPath === 'error')).toBe(false);
        });
    });

    describe('4. Traversal Depth Guard', () => {
        it('should stop traversal at MAX_JSON_DEPTH', () => {
            const observer = new FieldObserver();
            
            // Create deep object
            let deep: any = { val: 1 };
            for (let i = 0; i < 300; i++) {
                deep = { next: deep };
            }

            // Should not crash
            observer.observeBody(deep as any);
            
            const observations = observer.getObservations();
            // Should have some fields but not 300+
            expect(observations.length).toBeLessThan(250);
            expect(observations.length).toBeGreaterThan(100);
        });
    });

    describe('5. Timestamp Validation', () => {
        it('should skip invalid timestamps', () => {
            const samples: TrafficSample[] = [
                { timestamp: '2026-03-09T10:00:00Z', method: 'GET', path: '/a', statusCode: 200 },
                { timestamp: 'invalid-date', method: 'GET', path: '/b', statusCode: 200 },
                { timestamp: '2026-03-09T11:00:00Z', method: 'GET', path: '/c', statusCode: 200 }
            ];

            const window = buildObservationWindow(samples);
            expect(window.sampleCount).toBe(2);
            expect(window.startTime).toBe('2026-03-09T10:00:00.000Z');
            expect(window.endTime).toBe('2026-03-09T11:00:00.000Z');

            const groups = groupByEndpoint(samples);
            expect(groups.size).toBe(2); // /a and /c, /b is skipped
        });
    });

    describe('6. Path Matcher Specificity', () => {
        it('should sort templates by specificity', () => {
            const matcher = new PathMatcher([
                '/users/{id}',
                '/users/me',
                '/users/{id}/posts'
            ]);

            // /users/me should be first checked and matched
            expect(matcher.match('/users/me')).toBe('/users/me');
            expect(matcher.match('/users/123')).toBe('/users/{id}');
            expect(matcher.match('/users/123/posts')).toBe('/users/{id}/posts');
        });
    });

    describe('7. Bounded Array Sampling', () => {
        it('should inspect first 3 elements of arrays', () => {
            const observer = new FieldObserver();
            const body: any = {
                items: [
                    { a: 1 },
                    { b: 2 },
                    { c: 3 },
                    { d: 4 } // Should be ignored
                ]
            };

            observer.observeBody(body);
            const observations = observer.getObservations();
            
            const paths = observations.map(o => o.path);
            expect(paths).toContain('items[0].a');
            expect(paths).toContain('items[1].b');
            expect(paths).toContain('items[2].c');
            expect(paths).not.toContain('items[3].d');
        });
    });
});

/**
 * v3.1.1 Fixes Verification
 */
import { buildObservationWindow } from './ingestion/window-builder.js';
import { PathMatcher } from './comparison/path-matcher.js';
import { detectDrift } from './comparison/drift-detector.js';
import { FieldObserver } from './observation/field-observer.js';
import { SpecEndpoint, TrafficSample, EndpointObservation } from './types.js';

describe('v3.1.1 Fixes Verification', () => {
    
    describe('P0: Stack Overflow in buildObservationWindow', () => {
        it('should handle a large number of samples without stack overflow', () => {
            const count = 1000;
            const samples: TrafficSample[] = [];
            
            for (let i = 0; i < count; i++) {
                samples.push({
                    timestamp: new Date(2023, 0, 1, 0, 0, i).toISOString(),
                    method: 'GET',
                    path: '/test',
                    statusCode: 200
                });
            }

            const window = buildObservationWindow(samples);
            expect(window.sampleCount).toBe(count);
            expect(window.startTime).toBe(new Date(2023, 0, 1, 0, 0, 0).toISOString());
            expect(window.endTime).toBe(new Date(2023, 0, 1, 0, 0, count - 1).toISOString());
        });
    });

    describe('P1: Missing Required Fields', () => {
        it('should report a required field that was never observed', () => {
            const spec: SpecEndpoint = {
                method: 'GET',
                path: '/api/user',
                responses: {
                    200: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            name: { type: 'string' }
                        },
                        required: ['id', 'name']
                    }
                }
            };

            const observation: EndpointObservation = {
                method: 'GET',
                path: '/api/user',
                window: {
                    startTime: '2023-01-01T00:00:00Z',
                    endTime: '2023-01-01T00:10:00Z',
                    sampleCount: 10
                },
                responseFields: [
                    {
                        path: 'name',
                        occurrenceCount: 10,
                        occurrencePercentage: 100,
                        observedTypes: ['string'],
                        sampleValues: ['Alice']
                    }
                ],
                requestFields: [],
                statusCodes: { 200: 10 }
            };

            const findings = detectDrift(spec, observation);
            const missingId = findings.find(f => f.type === 'missing-field' && f.fieldPath === 'id');
            
            expect(missingId).toBeDefined();
            expect(missingId?.observed.count).toBe(0);
        });
    });

    describe('P1: Path Template Matching', () => {
        it('should match templated paths correctly', () => {
            const matcher = new PathMatcher([
                '/users/{id}',
                '/users/{id}/orders/{oid}',
                '/static/page'
            ]);

            expect(matcher.match('/users/123')).toBe('/users/{id}');
            expect(matcher.match('/users/abc/orders/789')).toBe('/users/{id}/orders/{oid}');
            expect(matcher.match('/static/page')).toBe('/static/page');
            expect(matcher.match('/users/123/profile')).toBeUndefined();
        });
    });

    describe('P2: Primitive Body Guard', () => {
        it('should not skip valid primitive bodies like 0 or false', () => {
            const observer = new FieldObserver();
            
            observer.observeBody(0);
            observer.observeBody(false);
            observer.observeBody("");
            
            expect(observer.getTotalSamples()).toBe(3);
        });
    });
});

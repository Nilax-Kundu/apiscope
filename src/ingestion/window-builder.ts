/**
 * Observation window builder
 * Calculates time range and metadata from traffic samples
 */

import { TrafficSample, ObservationWindow, HttpMethod } from '../types.js';

/**
 * Builds observation window metadata from traffic samples
 */
export function buildObservationWindow(samples: TrafficSample[]): ObservationWindow {
    if (samples.length === 0) {
        throw new Error('Cannot build observation window from empty samples array');
    }

    const timestamps = samples.map(s => new Date(s.timestamp).getTime());
    const startTime = new Date(Math.min(...timestamps)).toISOString();
    const endTime = new Date(Math.max(...timestamps)).toISOString();

    return {
        startTime,
        endTime,
        sampleCount: samples.length,
    };
}

/**
 * Groups traffic samples by endpoint (method + path)
 */
export function groupByEndpoint(samples: TrafficSample[]): Map<string, TrafficSample[]> {
    const groups = new Map<string, TrafficSample[]>();

    for (const sample of samples) {
        const key = `${sample.method} ${sample.path}`;
        const existing = groups.get(key) || [];
        existing.push(sample);
        groups.set(key, existing);
    }

    return groups;
}

/**
 * Parses endpoint key back to method and path
 */
export function parseEndpointKey(key: string): { method: HttpMethod; path: string } {
    const parts = key.split(' ');
    const method = parts[0] as HttpMethod;
    const path = parts.slice(1).join(' ');

    return { method, path };
}

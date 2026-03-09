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

    let min = Infinity;
    let max = -Infinity;

    for (const sample of samples) {
        const ts = new Date(sample.timestamp).getTime();
        if (ts < min) min = ts;
        if (ts > max) max = ts;
    }

    const startTime = new Date(min).toISOString();
    const endTime = new Date(max).toISOString();

    return {
        startTime,
        endTime,
        sampleCount: samples.length,
    };
}

/**
 * Groups traffic samples by endpoint (method + path)
 * Optional pathMapper can be used to normalize paths (e.g., for template matching)
 */
export function groupByEndpoint(
    samples: TrafficSample[],
    pathMapper: (method: HttpMethod, path: string) => string = (_, p) => p
): Map<string, TrafficSample[]> {
    const groups = new Map<string, TrafficSample[]>();

    for (const sample of samples) {
        const mappedPath = pathMapper(sample.method, sample.path);
        const key = `${sample.method} ${mappedPath}`;
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

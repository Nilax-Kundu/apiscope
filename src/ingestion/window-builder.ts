/**
 * Observation window builder
 * Calculates time range and metadata from traffic samples
 */

import { TrafficSample, ObservationWindow, HttpMethod } from '../types.js';

/**
 * Builds observation window metadata from traffic samples
 */
export function buildObservationWindow(samples: TrafficSample[]): ObservationWindow {
    let min = Infinity;
    let max = -Infinity;
    let validCount = 0;

    for (const sample of samples) {
        const date = new Date(sample.timestamp);
        const ts = date.getTime();
        
        if (isNaN(ts)) {
            continue; // Skip invalid timestamps
        }

        if (ts < min) min = ts;
        if (ts > max) max = ts;
        validCount++;
    }

    if (validCount === 0) {
        // Fallback if no valid samples, though caller should handle
        return {
            startTime: new Date().toISOString(),
            endTime: new Date().toISOString(),
            sampleCount: 0,
        };
    }

    const startTime = new Date(min).toISOString();
    const endTime = new Date(max).toISOString();

    return {
        startTime,
        endTime,
        sampleCount: validCount,
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
        if (isNaN(new Date(sample.timestamp).getTime())) {
            continue;
        }
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

/**
 * Traffic sample reader
 * Reads JSON traffic samples and validates required fields
 */

import { TrafficSample, HttpMethod } from '../types.js';

const VALID_HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Validates that a value is a valid HTTP method
 */
function isValidHttpMethod(method: unknown): method is HttpMethod {
    return typeof method === 'string' && VALID_HTTP_METHODS.includes(method as HttpMethod);
}

/**
 * Validates a single traffic sample
 * Fails explicitly if required fields are missing or invalid
 */
function validateTrafficSample(sample: unknown, index: number): TrafficSample {
    if (!sample || typeof sample !== 'object') {
        throw new Error(`Sample at index ${index}: expected object, got ${typeof sample}`);
    }

    const obj = sample as Record<string, unknown>;

    // Validate timestamp
    if (typeof obj.timestamp !== 'string') {
        throw new Error(`Sample at index ${index}: missing or invalid 'timestamp' field (expected string)`);
    }

    // Validate method
    if (!isValidHttpMethod(obj.method)) {
        throw new Error(
            `Sample at index ${index}: invalid 'method' field (expected one of ${VALID_HTTP_METHODS.join(', ')})`
        );
    }

    // Validate path
    if (typeof obj.path !== 'string') {
        throw new Error(`Sample at index ${index}: missing or invalid 'path' field (expected string)`);
    }

    // Validate statusCode
    if (typeof obj.statusCode !== 'number' || !Number.isInteger(obj.statusCode)) {
        throw new Error(`Sample at index ${index}: missing or invalid 'statusCode' field (expected integer)`);
    }

    return {
        timestamp: obj.timestamp,
        method: obj.method,
        path: obj.path,
        statusCode: obj.statusCode,
        requestBody: obj.requestBody as any,
        responseBody: obj.responseBody as any,
    };
}

/**
 * Reads and parses traffic samples from JSON
 * @param jsonContent - JSON string or parsed JSON array
 * @returns Array of validated traffic samples
 * @throws Error if JSON is invalid or samples fail validation
 */
export function readTrafficSamples(jsonContent: string | unknown[]): TrafficSample[] {
    let parsed: unknown;

    if (typeof jsonContent === 'string') {
        try {
            parsed = JSON.parse(jsonContent);
        } catch (err) {
            throw new Error(`Failed to parse JSON: ${err instanceof Error ? err.message : String(err)}`);
        }
    } else {
        parsed = jsonContent;
    }

    if (!Array.isArray(parsed)) {
        throw new Error('Expected JSON array of traffic samples');
    }

    if (parsed.length === 0) {
        throw new Error('Traffic samples array is empty');
    }

    return parsed.map((sample, index) => validateTrafficSample(sample, index));
}

/**
 * OpenAPI spec loader
 * Reads and parses OpenAPI 3.x specifications
 */

import { readFileSync } from 'fs';
import YAML from 'yaml';
import { SpecEndpoint, HttpMethod } from '../types.js';

/**
 * Loads OpenAPI spec from file (JSON or YAML)
 */
export function loadSpec(filePath: string): any {
    const content = readFileSync(filePath, 'utf-8');

    // Try JSON first
    if (filePath.endsWith('.json')) {
        return JSON.parse(content);
    }

    // Try YAML
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
        return YAML.parse(content);
    }

    // Auto-detect
    try {
        return JSON.parse(content);
    } catch {
        return YAML.parse(content);
    }
}

/**
 * Extracts endpoint definitions from OpenAPI spec
 */
export function extractEndpoints(spec: any): SpecEndpoint[] {
    const endpoints: SpecEndpoint[] = [];

    if (!spec.paths) {
        return endpoints;
    }

    for (const [path, pathItem] of Object.entries(spec.paths)) {
        if (!pathItem || typeof pathItem !== 'object') {
            continue;
        }

        const methods: Lowercase<HttpMethod>[] = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'];

        for (const method of methods) {
            const operation = (pathItem as any)[method];
            if (!operation) {
                continue;
            }

            const responses: Record<number, any> = {};
            if (operation.responses) {
                for (const [statusCode, responseObj] of Object.entries(operation.responses)) {
                    const code = parseInt(statusCode, 10);
                    if (!isNaN(code)) {
                        responses[code] = (responseObj as any)?.content?.['application/json']?.schema || {};
                    }
                }
            }

            endpoints.push({
                method: method.toUpperCase() as HttpMethod,
                path,
                responses,
                requestBody: operation.requestBody?.content?.['application/json']?.schema,
            });
        }
    }

    return endpoints;
}

/**
 * Field observer
 * Observes field-level behavior from response/request bodies
 */

import { FieldObservation, JsonValue, JsonObject } from '../types.js';

/**
 * Maximum number of unique sample values to store per field
 */
const MAX_SAMPLE_VALUES = 10;

/**
 * Extracts all field paths from a JSON object
 * Returns paths in dot notation (e.g., "user.email", "items[0].id")
 */
function extractFieldPaths(obj: JsonValue, prefix = ''): Map<string, JsonValue> {
    const fields = new Map<string, JsonValue>();

    if (obj === null || obj === undefined) {
        return fields;
    }

    if (typeof obj !== 'object') {
        if (prefix) {
            fields.set(prefix, obj);
        }
        return fields;
    }

    if (Array.isArray(obj)) {
        // Add the array field itself if we have a prefix
        if (prefix) {
            fields.set(prefix, obj);
        }

        // For arrays, examine first element to get structure
        if (obj.length > 0) {
            const firstElement = obj[0];
            const arrayPrefix = prefix ? `${prefix}[0]` : '[0]';

            // Add the array element itself
            fields.set(arrayPrefix, firstElement);

            // If the element is an object, recurse into it
            if (firstElement !== null && typeof firstElement === 'object' && !Array.isArray(firstElement)) {
                const nested = extractFieldPaths(firstElement, arrayPrefix);
                for (const [path, value] of nested) {
                    // Skip the array element itself as we already added it
                    if (path !== arrayPrefix) {
                        fields.set(path, value);
                    }
                }
            }
        }
    } else {
        // For objects, recurse into each property
        const jsonObj = obj as JsonObject;
        for (const [key, value] of Object.entries(jsonObj)) {
            const fieldPath = prefix ? `${prefix}.${key}` : key;
            fields.set(fieldPath, value);

            if (value !== null && typeof value === 'object') {
                const nested = extractFieldPaths(value, fieldPath);
                for (const [path, val] of nested) {
                    fields.set(path, val);
                }
            }
        }
    }

    return fields;
}

/**
 * Gets the type name for a JSON value
 */
function getTypeName(value: JsonValue): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
}

/**
 * Tracks field observations across multiple samples
 */
export class FieldObserver {
    private fieldData = new Map<
        string,
        {
            count: number;
            types: Set<string>;
            values: Set<string>; // JSON-stringified values for uniqueness
        }
    >();
    private totalSamples = 0;

    /**
   * Observes fields from a single body (request or response)
     */
    observeBody(body: JsonValue | undefined): void {
        this.totalSamples++;

        if (!body) {
            return;
        }

        const fields = extractFieldPaths(body);

        for (const [path, value] of fields) {
            if (!this.fieldData.has(path)) {
                this.fieldData.set(path, {
                    count: 0,
                    types: new Set(),
                    values: new Set(),
                });
            }

            const data = this.fieldData.get(path)!;
            data.count++;
            data.types.add(getTypeName(value));

            // Store sample value (limited to MAX_SAMPLE_VALUES unique values)
            if (data.values.size < MAX_SAMPLE_VALUES) {
                data.values.add(JSON.stringify(value));
            }
        }
    }

    /**
     * Gets field observations
     */
    getObservations(): FieldObservation[] {
        const observations: FieldObservation[] = [];

        for (const [path, data] of this.fieldData) {
            observations.push({
                path,
                occurrenceCount: data.count,
                occurrencePercentage: this.totalSamples > 0 ? (data.count / this.totalSamples) * 100 : 0,
                observedTypes: Array.from(data.types).sort(),
                sampleValues: Array.from(data.values)
                    .slice(0, MAX_SAMPLE_VALUES)
                    .map(v => JSON.parse(v)),
            });
        }

        return observations.sort((a, b) => a.path.localeCompare(b.path));
    }

    /**
     * Gets total sample count
     */
    getTotalSamples(): number {
        return this.totalSamples;
    }
}

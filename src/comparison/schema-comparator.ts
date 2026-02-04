/**
 * Schema comparator
 * Compares OpenAPI schema with observed behavior
 */

import { FieldObservation } from '../types.js';

/**
 * Result of schema comparison for a field
 */
export interface FieldComparison {
    fieldPath: string;
    inSpec: boolean;
    inObserved: boolean;
    specTypes?: string[];
    observedTypes?: string[];
    specRequired?: boolean;
    observedOccurrencePercentage?: number;
}

/**
 * Extracts field paths and types from JSON schema (simplified)
 */
function extractSchemaFields(schema: any, prefix = ''): Map<string, { types: string[]; required: boolean }> {
    const fields = new Map<string, { types: string[]; required: boolean }>();

    if (!schema || typeof schema !== 'object') {
        return fields;
    }

    // Handle object schemas
    if (schema.type === 'object' && schema.properties) {
        const required = Array.isArray(schema.required) ? schema.required : [];

        for (const [propName, propSchema] of Object.entries(schema.properties)) {
            const fieldPath = prefix ? `${prefix}.${propName}` : propName;
            const isRequired = required.includes(propName);

            // Get type(s)
            let types: string[] = [];
            const prop = propSchema as any;
            if (prop.type) {
                types = Array.isArray(prop.type) ? prop.type : [prop.type];
            } else if (prop.anyOf || prop.oneOf) {
                // Simplified: extract types from anyOf/oneOf
                const variants = prop.anyOf || prop.oneOf;
                types = variants.map((v: any) => v.type).filter(Boolean);
            }

            fields.set(fieldPath, { types, required: isRequired });

            // Recurse for nested objects
            if (prop.type === 'object') {
                const nested = extractSchemaFields(prop, fieldPath);
                for (const [path, info] of nested) {
                    fields.set(path, info);
                }
            }

            // Recurse for array items
            if (prop.type === 'array' && prop.items) {
                const arrayPath = `${fieldPath}[0]`;
                const nested = extractSchemaFields(prop.items, arrayPath);
                for (const [path, info] of nested) {
                    fields.set(path, info);
                }
            }
        }
    }

    return fields;
}

/**
 * Compares spec schema with observed fields
 */
export function compareFields(
    specSchema: any,
    observedFields: FieldObservation[]
): FieldComparison[] {
    const specFields = extractSchemaFields(specSchema);
    const comparisons: FieldComparison[] = [];

    const allPaths = new Set<string>();
    for (const path of specFields.keys()) {
        allPaths.add(path);
    }
    for (const field of observedFields) {
        allPaths.add(field.path);
    }

    for (const path of allPaths) {
        const specInfo = specFields.get(path);
        const obsInfo = observedFields.find(f => f.path === path);

        comparisons.push({
            fieldPath: path,
            inSpec: !!specInfo,
            inObserved: !!obsInfo,
            specTypes: specInfo?.types,
            observedTypes: obsInfo?.observedTypes,
            specRequired: specInfo?.required,
            observedOccurrencePercentage: obsInfo?.occurrencePercentage,
        });
    }

    return comparisons;
}

/**
 * Normalizes type names for comparison (e.g., "integer" -> "number")
 */
function normalizeType(type: string): string {
    if (type === 'integer') return 'number';
    return type;
}

/**
 * Checks if observed types match spec types
 */
export function typesMatch(specTypes: string[] | undefined, observedTypes: string[] | undefined): boolean {
    if (!specTypes || !observedTypes) return true; // Can't determine mismatch

    const normalizedSpec = specTypes.map(normalizeType).sort();
    const normalizedObs = observedTypes.map(normalizeType).sort();

    // Check if there's any overlap
    return normalizedSpec.some(st => normalizedObs.includes(st));
}

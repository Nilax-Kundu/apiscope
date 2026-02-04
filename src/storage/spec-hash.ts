/**
 * Spec hash calculator
 * Generates SHA-256 hash of spec file content for change detection
 */

import { createHash } from 'crypto';
import { readFileSync } from 'fs';

/**
 * Calculate SHA-256 hash of spec file
 */
export function calculateSpecHash(specFilePath: string): string {
    const content = readFileSync(specFilePath, 'utf-8');
    return createHash('sha256').update(content).digest('hex');
}

/**
 * Integration smoke test for apiscope CLI
 */

import { execSync } from 'child_process';

describe('apiscope CLI Smoke Test', () => {
    const specPath = 'examples/example-spec.json';
    const trafficPath = 'examples/example-traffic.json';

    it('should run successfully and output valid JSON drift findings', () => {
        // Use 'node --loader tsx' or just 'tsx' via npx
        // Using tsx directly is usually safer for running .ts files
        const command = `npx tsx src/index.ts "${specPath}" "${trafficPath}"`;

        try {
            // Capture both stdout and stderr
            const output = execSync(command, { encoding: 'utf-8' });

            // Verify output is valid JSON
            const report = JSON.parse(output);

            expect(report).toHaveProperty('findings');
            expect(report.findings.length).toBeGreaterThan(0);

            // Check for 'createdAt' which is undocumented on POST /api/users
            const hasCreatedAtDrift = report.findings.some((f: any) => f.fieldPath === 'createdAt');
            expect(hasCreatedAtDrift).toBe(true);

        } catch (error: any) {
            // If it fails, the error object should contain stdout/stderr
            const msg = error.stdout || error.stderr || error.message;
            throw new Error(`CLI execution failed: ${msg}`);
        }
    });

    it('should run in V3 mode successfully', () => {
        const command = `npx tsx src/index.ts "${specPath}" "${trafficPath}" --v2 --service-name test-api --environment test --v3 --compact`;

        try {
            const output = execSync(command, { encoding: 'utf-8' });
            const report = JSON.parse(output);

            expect(report).toHaveProperty('report');
            expect(report.report).toHaveProperty('findings');
        } catch (error: any) {
            const msg = error.stdout || error.stderr || error.message;
            throw new Error(`CLI V3 execution failed: ${msg}`);
        }
    });
});

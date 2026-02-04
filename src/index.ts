/**
 * Main entry point for ObservedAPIdrift
 * Wires together all components and outputs structured JSON report
 */

import { readFileSync } from 'fs';
import { readTrafficSamples } from './ingestion/traffic-reader.js';
import { buildObservationWindow, groupByEndpoint, parseEndpointKey } from './ingestion/window-builder.js';
import { buildEndpointObservation } from './observation/endpoint-observer.js';
import { loadSpec, extractEndpoints } from './comparison/spec-loader.js';
import { detectDrift } from './comparison/drift-detector.js';
import { buildDriftReport } from './report/report-builder.js';
import { createEmptyReport } from './report/empty-state.js';
import { DriftFinding } from './types.js';

/**
 * Main function
 */
async function main() {
    const args = process.argv.slice(2);

    if (args.length < 2) {
        console.error('Usage: node dist/index.js <spec-file> <traffic-file>');
        process.exit(1);
    }

    const [specFile, trafficFile] = args;

    try {
        // Parse arguments (simple manual parsing)
        const v2Enabled = args.includes('--v2');
        const v3Enabled = args.includes('--v3');
        let serviceName = '';
        let environment = '';

        // V3 flags (opt-in)
        const densityMode = args.includes('--compact') ? 'compact' : 'verbose';
        const groupByIndex = args.indexOf('--group-by');
        const groupBy = (groupByIndex !== -1 && groupByIndex + 1 < args.length)
            ? args[groupByIndex + 1] as 'endpoint' | 'field' | 'status' | 'none'
            : 'none';
        const formatIndex = args.indexOf('--format');
        const format = (formatIndex !== -1 && formatIndex + 1 < args.length)
            ? args[formatIndex + 1] as 'json' | 'json-pretty' | 'ndjson'
            : 'json-pretty'; // Default to pretty for better readability

        if (v2Enabled) {
            const serviceIndex = args.indexOf('--service-name');
            const envIndex = args.indexOf('--environment');

            if (serviceIndex !== -1 && serviceIndex + 1 < args.length) {
                serviceName = args[serviceIndex + 1];
            }
            if (envIndex !== -1 && envIndex + 1 < args.length) {
                environment = args[envIndex + 1];
            }

            if (!serviceName || !environment) {
                console.error('Error: --service-name and --environment are required when using --v2');
                process.exit(1);
            }
        }

        // Load OpenAPI spec
        const spec = loadSpec(specFile);
        const specEndpoints = extractEndpoints(spec);
        const specMap = new Map(specEndpoints.map(e => [`${e.method} ${e.path}`, e]));

        // Read traffic samples
        const trafficJson = readFileSync(trafficFile, 'utf-8');
        const samples = readTrafficSamples(trafficJson);

        // Build observation window
        const globalWindow = buildObservationWindow(samples);

        // Group by endpoint
        const endpointGroups = groupByEndpoint(samples);

        // Build observations and detect drift
        const allFindings: DriftFinding[] = [];

        for (const [endpointKey, endpointSamples] of endpointGroups) {
            const { method, path } = parseEndpointKey(endpointKey);

            // Build observation
            const observation = buildEndpointObservation(method, path, endpointSamples, globalWindow);

            // Find matching spec endpoint
            const specEndpoint = specMap.get(endpointKey);

            // Detect drift
            const findings = detectDrift(specEndpoint, observation);
            allFindings.push(...findings);
        }

        // Build V1 report
        const v1Report =
            allFindings.length === 0
                ? createEmptyReport(globalWindow, endpointGroups.size)
                : buildDriftReport(allFindings, globalWindow, endpointGroups.size);

        if (v2Enabled) {
            // V2 Mode
            const { FileReportStorage } = await import('./storage/file-storage.js');
            const { buildReportV2 } = await import('./v2/report-builder-v2.js');

            const storage = new FileReportStorage();

            const v2Report = await buildReportV2(v1Report, {
                serviceName,
                environment,
                specFilePath: specFile,
                toolVersion: '2.0.0', // Hardcoded for now, could be from package.json
                storage
            });

            // Save report
            await storage.saveReport(v2Report);

            // V3 enhancements (if enabled)
            if (v3Enabled) {
                const { applyDensityControl, formatDensitySummary } = await import('./presentation/density-filter.js');
                const { groupFindings } = await import('./presentation/grouping.js');
                const { buildDeltaSummary, formatDeltaSummary } = await import('./presentation/delta-summary.js');
                const { exportReport } = await import('./presentation/exporters.js');
                const { NON_GOALS_FOOTER } = await import('./presentation/footer.js');

                // Apply density control
                const view = applyDensityControl(v2Report.report.findings, densityMode);

                // Generate delta summary header
                const deltaSummary = buildDeltaSummary(v2Report.changes);
                const deltaText = formatDeltaSummary(deltaSummary);

                // Generate density summary
                const densityText = formatDensitySummary(view);

                // Print headers
                if (deltaText) {
                    console.error(deltaText); // To stderr so JSON remains pure on stdout
                }
                if (densityText) {
                    console.error(densityText);
                }
                console.error(''); // Blank line

                // Apply grouping and export
                const groups = groupFindings(view.findings, groupBy);
                const output = {
                    ...v2Report,
                    report: {
                        ...v2Report.report,
                        findings: Array.from(groups.entries()).map(([key, findings]) => ({
                            group: key,
                            findings
                        }))
                    }
                };

                // Export formatted output
                console.log(exportReport(output, format));

                // Print footer
                console.error('');
                console.error(NON_GOALS_FOOTER);
            } else {
                // Standard V2 output
                console.log(JSON.stringify(v2Report, null, 2));
            }
        } else {
            // V1 Mode (Default)
            console.log(JSON.stringify(v1Report, null, 2));
        }
    } catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}

main();

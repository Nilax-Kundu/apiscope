/**
 * V2 Report Builder
 * Wires together V1 reports, diffs, trends, and history
 */

import { randomUUID } from 'crypto';
import {
    DriftReportV2,
    DriftReport,
    RunMetadata,
    SpecChange
} from '../types.js';
import { calculateSpecHash } from '../storage/spec-hash.js';
import { ReportStorage } from '../storage/report-storage.js';
import { detectChanges } from '../diff/change-detector.js';
import { buildTrends } from '../trends/trend-builder.js';
import { buildContinuitySignal } from '../continuity/continuity-builder.js';

/**
 * Options for building a V2 report
 */
export interface ReportBuilderV2Options {
    serviceName: string;
    environment: string;
    specFilePath: string;
    toolVersion: string;
    storage: ReportStorage;
}

/**
 * Build a complete V2 report
 */
export async function buildReportV2(
    v1Report: DriftReport,
    options: ReportBuilderV2Options
): Promise<DriftReportV2> {
    const runId = randomUUID();
    const executedAt = new Date().toISOString();
    const currentSpecHash = calculateSpecHash(options.specFilePath);

    // 1. Create run metadata
    const run: RunMetadata = {
        runId,
        executedAt,
        serviceName: options.serviceName,
        environment: options.environment,
        specHash: currentSpecHash,
        toolVersion: options.toolVersion,
    };

    // 2. Load previous run
    const previousRunRef = await options.storage.getPreviousRun(
        options.serviceName,
        options.environment
    );

    let previousRunData: DriftReportV2 | null = null;
    if (previousRunRef) {
        previousRunData = await options.storage.loadReport(previousRunRef.runId);
    }

    // 3. Detect Spec Changes
    let specChange: SpecChange | undefined;
    if (previousRunData && previousRunData.run.specHash !== currentSpecHash) {
        specChange = {
            previousHash: previousRunData.run.specHash,
            currentHash: currentSpecHash,
            note: 'Specification changed between compared runs'
        };
    }

    // 4. Generate Change Events
    const changes = previousRunData
        ? detectChanges(previousRunData.report, v1Report)
        : [];

    // 5. Generate Trends
    // Fetch last N runs for trends
    const recentRefs = await options.storage.listRecentRuns(
        options.serviceName,
        options.environment,
        5 // Look back 5 runs
    );

    const historicalReports: DriftReportV2[] = [];
    for (const ref of recentRefs) {
        if (ref.runId === runId) continue; // Skip self if present (unlikely)
        const historic = await options.storage.loadReport(ref.runId);
        if (historic) historicalReports.push(historic);
    }

    // Pass V1 report findings correctly
    const trends = buildTrends(v1Report.findings, historicalReports);

    // 6. Generate Continuity Signal
    const continuity = buildContinuitySignal(
        historicalReports.length + (previousRunData ? 1 : 0),
        changes,
        v1Report.findings.length
    );

    // 7. Assemble V2 Report
    const reportV2: DriftReportV2 = {
        schemaVersion: '2.0',
        report: v1Report, // Frozen V1
        run,
        previousRun: previousRunRef || undefined,
        specChange,
        changes,
        trends,
        continuity
    };

    return reportV2;
}

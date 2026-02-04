/**
 * Report storage interface
 * Persistence layer for cross-run comparison
 */

import { DriftReportV2, PreviousRunRef } from '../types.js';

/**
 * Storage interface for drift reports
 */
export interface ReportStorage {
    /**
     * Save a drift report
     */
    saveReport(report: DriftReportV2): Promise<void>;

    /**
     * Load a drift report by run ID
     */
    loadReport(runId: string): Promise<DriftReportV2 | null>;

    /**
     * Get the most recent run for a service/environment
     */
    getPreviousRun(serviceName: string, environment: string): Promise<PreviousRunRef | null>;

    /**
     * List recent runs for a service/environment
     */
    listRecentRuns(serviceName: string, environment: string, limit: number): Promise<PreviousRunRef[]>;
}

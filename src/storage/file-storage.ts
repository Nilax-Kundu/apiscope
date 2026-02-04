/**
 * File-based report storage implementation
 * Stores reports in .drift-reports/ directory
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { DriftReportV2, PreviousRunRef } from '../types.js';
import { ReportStorage } from './report-storage.js';

/**
 * Metadata index entry
 */
interface IndexEntry {
    runId: string;
    executedAt: string;
    serviceName: string;
    environment: string;
}

/**
 * File-based storage implementation
 */
export class FileReportStorage implements ReportStorage {
    private baseDir: string;

    constructor(baseDir: string = '.drift-reports') {
        this.baseDir = baseDir;
        this.ensureBaseDir();
    }

    private ensureBaseDir(): void {
        if (!existsSync(this.baseDir)) {
            mkdirSync(this.baseDir, { recursive: true });
        }
    }

    private getReportFilePath(runId: string): string {
        return join(this.baseDir, `${runId}.json`);
    }

    private getIndexFilePath(serviceName: string, environment: string): string {
        return join(this.baseDir, `${serviceName}-${environment}-index.json`);
    }

    private loadIndex(serviceName: string, environment: string): IndexEntry[] {
        const indexPath = this.getIndexFilePath(serviceName, environment);
        if (!existsSync(indexPath)) {
            return [];
        }

        try {
            const content = readFileSync(indexPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return [];
        }
    }

    private saveIndex(serviceName: string, environment: string, entries: IndexEntry[]): void {
        const indexPath = this.getIndexFilePath(serviceName, environment);
        writeFileSync(indexPath, JSON.stringify(entries, null, 2), 'utf-8');
    }

    async saveReport(report: DriftReportV2): Promise<void> {
        // Save report file
        const reportPath = this.getReportFilePath(report.run.runId);
        writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

        // Update index
        const index = this.loadIndex(report.run.serviceName, report.run.environment);

        // Add new entry
        index.push({
            runId: report.run.runId,
            executedAt: report.run.executedAt,
            serviceName: report.run.serviceName,
            environment: report.run.environment,
        });

        // Sort by executedAt (most recent first)
        index.sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());

        // Keep only last 100 entries
        const trimmedIndex = index.slice(0, 100);

        this.saveIndex(report.run.serviceName, report.run.environment, trimmedIndex);
    }

    async loadReport(runId: string): Promise<DriftReportV2 | null> {
        const reportPath = this.getReportFilePath(runId);
        if (!existsSync(reportPath)) {
            return null;
        }

        try {
            const content = readFileSync(reportPath, 'utf-8');
            return JSON.parse(content);
        } catch {
            return null;
        }
    }

    async getPreviousRun(serviceName: string, environment: string): Promise<PreviousRunRef | null> {
        const index = this.loadIndex(serviceName, environment);
        if (index.length === 0) {
            return null;
        }

        // Index is sorted by executedAt desc, so first entry is most recent
        const mostRecent = index[0];
        return {
            runId: mostRecent.runId,
            executedAt: mostRecent.executedAt,
        };
    }

    async listRecentRuns(serviceName: string, environment: string, limit: number): Promise<PreviousRunRef[]> {
        const index = this.loadIndex(serviceName, environment);
        return index.slice(0, limit).map(entry => ({
            runId: entry.runId,
            executedAt: entry.executedAt,
        }));
    }
}

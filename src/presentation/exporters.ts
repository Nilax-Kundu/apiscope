/**
 * Export Formats for V3
 * Structured export without transformation
 * 
 * INVARIANT: No summarization or interpretation
 */

export type ExportFormat = 'json' | 'json-pretty' | 'ndjson';

/**
 * Export report in specified format
 * Raw data only - no transformation
 * 
 * @param report - Report data to export
 * @param format - Export format
 * @returns Formatted string
 */
export function exportReport(
    report: unknown,
    format: ExportFormat
): string {
    switch (format) {
        case 'json':
            return JSON.stringify(report);
        case 'json-pretty':
            return JSON.stringify(report, null, 2);
        case 'ndjson':
            // Newline-delimited JSON
            return JSON.stringify(report) + '\n';
    }
}

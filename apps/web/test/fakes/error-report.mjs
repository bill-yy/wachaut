/** Stand-in for src/lib/error-report.ts: records what the client would report. */
export const reports = [];

export function captureClientError(err, ctx = {}) {
  reports.push({ err, ctx });
}

export function resetReports() {
  reports.length = 0;
}

export function installGlobalErrorHandlers() {}

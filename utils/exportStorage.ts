import { VALID_FIXED_KEYS, isValidYearKey } from '@/utils/importValidation';
import { ExportSummary } from '@/types/exportData.types';

/**
 * Reads all app data from localStorage and builds a complete snapshot object.
 *
 * - All fixed keys are included if present in localStorage.
 * - Year keys are discovered via the `expenseYearIndex` value.
 * - Keys absent from localStorage are omitted to keep the export clean.
 */
function buildExportSnapshot(): {
  data: Record<string, unknown>;
  keyCount: number;
  totalExpenses: number;
} {
  const snapshot: Record<string, unknown> = {};
  let totalExpenses = 0;

  // Read all known fixed keys
  for (const key of VALID_FIXED_KEYS) {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      try {
        snapshot[key] = JSON.parse(raw);
      } catch {
        // Skip malformed values silently
      }
    }
  }

  // Discover and read year keys from expenseYearIndex
  const yearIndex = snapshot['expenseYearIndex'];
  if (Array.isArray(yearIndex)) {
    for (const year of yearIndex) {
      if (typeof year === 'string' && isValidYearKey(year)) {
        const raw = localStorage.getItem(year);
        if (raw !== null) {
          try {
            const yearData = JSON.parse(raw);
            snapshot[year] = yearData;
            // Count expense records across all months in this year
            if (typeof yearData === 'object' && yearData !== null) {
              for (const monthData of Object.values(yearData)) {
                if (Array.isArray(monthData)) {
                  totalExpenses += monthData.length;
                }
              }
            }
          } catch {
            // Skip malformed year data silently
          }
        }
      }
    }
  }

  return { data: snapshot, keyCount: Object.keys(snapshot).length, totalExpenses };
}

/**
 * Generates the export filename in the format:
 * expense-tracker-export_YYYY-MM-DD_HH-mm-ss.json
 *
 * ISO date ordering (YYYY-MM-DD) ensures exports sort chronologically by name.
 * Hyphens replace colons, which are invalid in filenames on Windows and macOS.
 */
export function generateExportFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `expense-tracker-export_${yyyy}-${mm}-${dd}_${hh}-${min}-${ss}.json`;
}

/**
 * Builds a snapshot of all localStorage data, triggers a browser download
 * of the resulting JSON file, and returns an ExportSummary with stats.
 */
export function exportToFile(): ExportSummary {
  const exportedAt = new Date();
  const fileName = generateExportFileName(exportedAt);
  const { data, keyCount, totalExpenses } = buildExportSnapshot();

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);

  return { fileName, keyCount, totalExpenses, exportedAt };
}

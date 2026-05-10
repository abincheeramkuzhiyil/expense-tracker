export type ImportKeyStatus = 'success' | 'skipped' | 'error';

export interface ImportKeyResult {
  key: string;
  status: ImportKeyStatus;
  recordsImported: number;
  recordsFailed: number;
  message?: string;
}

export interface ImportSummary {
  results: ImportKeyResult[];
  totalImported: number;
  totalFailed: number;
}

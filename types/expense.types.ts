export interface Expense {
  id: string;
  amount: number;
  category: string;
  date: Date;
  description: string;
  source: 'manual' | 'sms';
  createdAt: Date;
  updatedAt: Date;
}

/** Expense as stored in localStorage — all dates are ISO strings */
export interface StoredExpense {
  id: string;
  amount: number;
  category: string;
  date: string;        // "YYYY-MM-DD"
  description: string;
  source: 'manual' | 'sms';
  createdAt: string;   // ISO string
  updatedAt: string;   // ISO string
}

/** Keys are numeric month strings "1"–"12"; only months with data are present */
export interface StoredYear {
  [monthKey: string]: StoredExpense[];
}

export type ViewMode = 'day' | 'month' | 'year';

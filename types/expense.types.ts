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

export type ViewMode = 'day' | 'month' | 'year';

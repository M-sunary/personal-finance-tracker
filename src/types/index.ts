export interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  color?: string;
}

export interface MonthlyStats {
  month: string;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  transactionCount: number;
}

export interface YearlyStats {
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  monthlyData: MonthlyStats[];
}

export interface DailyStats {
  date: string;
  income: number;
  expense: number;
  balance: number;
  transactions: Transaction[];
}
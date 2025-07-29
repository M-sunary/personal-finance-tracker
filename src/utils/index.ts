import { Transaction, Category } from '../types/index.ts';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from 'date-fns';

export const defaultCategories: Category[] = [
  // 收入分类
  { id: '1', name: '工资', type: 'income', color: '#10B981' },
  { id: '2', name: '兼职', type: 'income', color: '#059669' },
  { id: '3', name: '投资收益', type: 'income', color: '#047857' },
  { id: '4', name: '其他收入', type: 'income', color: '#065F46' },
  
  // 支出分类
  { id: '5', name: '餐饮', type: 'expense', color: '#EF4444' },
  { id: '6', name: '交通', type: 'expense', color: '#DC2626' },
  { id: '7', name: '购物', type: 'expense', color: '#B91C1C' },
  { id: '8', name: '娱乐', type: 'expense', color: '#991B1B' },
  { id: '9', name: '住房', type: 'expense', color: '#7F1D1D' },
  { id: '10', name: '医疗', type: 'expense', color: '#450A0A' },
  { id: '11', name: '其他支出', type: 'expense', color: '#450A0A' },
];

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM-dd');
};

export const formatMonth = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy-MM');
};

export const formatYear = (date: string | Date): string => {
  return format(typeof date === 'string' ? parseISO(date) : date, 'yyyy');
};

export const getMonthRange = (date: Date) => {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
};

export const getYearRange = (date: Date) => {
  return {
    start: startOfYear(date),
    end: endOfYear(date),
  };
};

export const filterTransactionsByDateRange = (
  transactions: Transaction[],
  startDate: Date,
  endDate: Date
): Transaction[] => {
  return transactions.filter(transaction => {
    const transactionDate = parseISO(transaction.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

export const calculateStats = (transactions: Transaction[]) => {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const totalExpense = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
  
  return {
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    transactionCount: transactions.length,
  };
};

export const exportToCSV = (transactions: Transaction[]): void => {
  const headers = ['日期', '类型', '分类', '金额', '备注', '创建时间'];
  const csvContent = [
    headers.join(','),
    ...transactions.map(t => [
      t.date,
      t.type === 'income' ? '收入' : '支出',
      t.category,
      t.amount.toString(),
      `"${t.description}"`,
      t.createdAt
    ].join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `财务记录_${format(new Date(), 'yyyy-MM-dd')}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToJSON = (data: { transactions: Transaction[]; categories: Category[] }): void => {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `财务数据_${format(new Date(), 'yyyy-MM-dd')}.json`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const importFromJSON = (file: File): Promise<{ transactions: Transaction[]; categories: Category[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        
        if (!data.transactions || !Array.isArray(data.transactions)) {
          throw new Error('Invalid JSON format: missing transactions array');
        }
        
        if (!data.categories || !Array.isArray(data.categories)) {
          throw new Error('Invalid JSON format: missing categories array');
        }
        
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
};
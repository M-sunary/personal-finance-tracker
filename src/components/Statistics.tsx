import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatCurrency, calculateStats, filterTransactionsByDateRange, getMonthRange, getYearRange } from '../utils/index.ts';
import { Calendar, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay } from 'date-fns';

type ViewMode = 'daily' | 'monthly' | 'yearly';

const Statistics: React.FC = () => {
  const { transactions } = useApp();
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const filteredStats = useMemo(() => {
    let filteredTransactions;
    
    switch (viewMode) {
      case 'daily':
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          startOfDay(selectedDate),
          endOfDay(selectedDate)
        );
        break;
      case 'monthly':
        const monthRange = getMonthRange(selectedDate);
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          monthRange.start,
          monthRange.end
        );
        break;
      case 'yearly':
        const yearRange = getYearRange(selectedDate);
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          yearRange.start,
          yearRange.end
        );
        break;
    }
    
    return calculateStats(filteredTransactions);
  }, [transactions, viewMode, selectedDate]);

  const categoryStats = useMemo(() => {
    let filteredTransactions;
    
    switch (viewMode) {
      case 'daily':
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          startOfDay(selectedDate),
          endOfDay(selectedDate)
        );
        break;
      case 'monthly':
        const monthRange = getMonthRange(selectedDate);
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          monthRange.start,
          monthRange.end
        );
        break;
      case 'yearly':
        const yearRange = getYearRange(selectedDate);
        filteredTransactions = filterTransactionsByDateRange(
          transactions,
          yearRange.start,
          yearRange.end
        );
        break;
    }

    const categoryTotals = filteredTransactions.reduce((acc, transaction) => {
      const key = `${transaction.category}-${transaction.type}`;
      if (!acc[key]) {
        acc[key] = {
          category: transaction.category,
          type: transaction.type,
          amount: 0,
          count: 0,
        };
      }
      acc[key].amount += transaction.amount;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { category: string; type: 'income' | 'expense'; amount: number; count: number }>);

    return Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);
  }, [transactions, viewMode, selectedDate]);

  const getDateDisplay = () => {
    switch (viewMode) {
      case 'daily':
        return format(selectedDate, 'yyyy年MM月dd日');
      case 'monthly':
        return format(selectedDate, 'yyyy年MM月');
      case 'yearly':
        return format(selectedDate, 'yyyy年');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">财务统计</h2>
          <div className="flex items-center space-x-2">
            <Calendar size={20} className="text-gray-500" />
            <span className="text-gray-700">{getDateDisplay()}</span>
          </div>
        </div>

        <div className="flex space-x-2 mb-6">
          {(['daily', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg ${
                viewMode === mode
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {mode === 'daily' ? '日' : mode === 'monthly' ? '月' : '年'}
            </button>
          ))}
        </div>

        <div className="mb-4">
          <input
            type={viewMode === 'daily' ? 'date' : viewMode === 'monthly' ? 'month' : 'number'}
            value={
              viewMode === 'daily'
                ? format(selectedDate, 'yyyy-MM-dd')
                : viewMode === 'monthly'
                ? format(selectedDate, 'yyyy-MM')
                : format(selectedDate, 'yyyy')
            }
            onChange={(e) => {
              if (viewMode === 'daily') {
                setSelectedDate(parseISO(e.target.value));
              } else if (viewMode === 'monthly') {
                setSelectedDate(parseISO(e.target.value + '-01'));
              } else {
                setSelectedDate(new Date(parseInt(e.target.value), 0, 1));
              }
            }}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">总收入</p>
                <p className="text-2xl font-bold text-green-700">
                  {formatCurrency(filteredStats.totalIncome)}
                </p>
              </div>
              <TrendingUp className="text-green-500" size={24} />
            </div>
          </div>

          <div className="bg-red-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600 font-medium">总支出</p>
                <p className="text-2xl font-bold text-red-700">
                  {formatCurrency(filteredStats.totalExpense)}
                </p>
              </div>
              <TrendingDown className="text-red-500" size={24} />
            </div>
          </div>

          <div className={`p-4 rounded-lg ${
            filteredStats.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${
                  filteredStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'
                }`}>
                  净收支
                </p>
                <p className={`text-2xl font-bold ${
                  filteredStats.balance >= 0 ? 'text-blue-700' : 'text-orange-700'
                }`}>
                  {formatCurrency(filteredStats.balance)}
                </p>
              </div>
              <DollarSign className={
                filteredStats.balance >= 0 ? 'text-blue-500' : 'text-orange-500'
              } size={24} />
            </div>
          </div>
        </div>

        <div className="text-center text-sm text-gray-500">
          交易笔数: {filteredStats.transactionCount}
        </div>
      </div>

      {categoryStats.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">分类统计</h3>
          <div className="space-y-3">
            {categoryStats.map(stat => (
              <div key={`${stat.category}-${stat.type}`} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      stat.type === 'income' ? 'bg-green-500' : 'bg-red-500'
                    }`}
                  />
                  <span className="font-medium">{stat.category}</span>
                  <span className="text-sm text-gray-500">({stat.count}笔)</span>
                </div>
                <span
                  className={`font-semibold ${
                    stat.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(stat.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Statistics;
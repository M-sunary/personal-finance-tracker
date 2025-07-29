import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { formatCurrency, formatDate } from '../utils/index.ts';
import { Trash2, Edit3 } from 'lucide-react';
import EditTransactionModal from './EditTransactionModal.tsx';
import { Transaction } from '../types/index.ts';

const TransactionList: React.FC = () => {
  const { transactions, deleteTransaction, categories } = useApp();
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const getCategoryColor = (categoryName: string, type: 'income' | 'expense') => {
    const category = categories.find(cat => cat.name === categoryName && cat.type === type);
    return category?.color || (type === 'income' ? '#10B981' : '#EF4444');
  };

  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
  };

  const handleCloseEdit = () => {
    setEditingTransaction(null);
  };

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">交易记录</h2>
        <div className="text-center py-8 text-gray-500">
          <p>暂无交易记录</p>
          <p className="text-sm mt-2">开始记录您的收入和支出吧！</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">交易记录</h2>
        <div className="space-y-3">
          {sortedTransactions.map(transaction => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center space-x-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: getCategoryColor(transaction.category, transaction.type) }}
                />
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">{transaction.category}</span>
                    {transaction.description && (
                      <span className="text-sm text-gray-500">
                        - {transaction.description}
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <span
                  className={`font-semibold ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.amount)}
                </span>
                
                <div className="flex space-x-1">
                  <button
                    onClick={() => handleEdit(transaction)}
                    className="p-1 text-gray-400 hover:text-blue-500"
                    title="编辑"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteTransaction(transaction.id)}
                    className="p-1 text-gray-400 hover:text-red-500"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {editingTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={!!editingTransaction}
          onClose={handleCloseEdit}
        />
      )}
    </>
  );
};

export default TransactionList;
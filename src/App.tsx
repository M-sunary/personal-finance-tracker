import React, { useState } from 'react';
import { AppProvider } from './context/AppContext.tsx';
import TransactionForm from './components/TransactionForm.tsx';
import TransactionList from './components/TransactionList.tsx';
import Statistics from './components/Statistics.tsx';
import CategoryManagement from './components/CategoryManagement.tsx';
import { PieChart, List, BarChart3, Settings } from 'lucide-react';
import './App.css';

type TabType = 'overview' | 'transactions' | 'statistics' | 'settings';

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TransactionForm />
              <div className="lg:row-span-2">
                <Statistics />
              </div>
            </div>
            <TransactionList />
          </div>
        );
      case 'transactions':
        return (
          <div className="space-y-6">
            <TransactionForm />
            <TransactionList />
          </div>
        );
      case 'statistics':
        return <Statistics />;
      case 'settings':
        return <CategoryManagement />;
      default:
        return null;
    }
  };

  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-3">
                <PieChart className="text-blue-500" size={32} />
                <h1 className="text-2xl font-bold text-gray-900">个人财务管理</h1>
              </div>
              
              <nav className="flex space-x-1">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'overview'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <BarChart3 size={16} />
                  <span>总览</span>
                </button>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'transactions'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <List size={16} />
                  <span>交易</span>
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'statistics'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <PieChart size={16} />
                  <span>统计</span>
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors ${
                    activeTab === 'settings'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Settings size={16} />
                  <span>设置</span>
                </button>
              </nav>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main>
      </div>
    </AppProvider>
  );
}

export default App;

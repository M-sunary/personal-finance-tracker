import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { Transaction, Category } from '../types/index.ts';
import { defaultCategories, generateId } from '../utils/index.ts';
import { databaseService, storageService } from '../services/storageService.ts';

interface AppState {
  transactions: Transaction[];
  categories: Category[];
  isLoading: boolean;
  storageInfo?: {
    indexedDBAvailable: boolean;
    localStorageAvailable: boolean;
    lastSync: string | null;
    dataCount: { transactions: number; categories: number };
  };
}

interface AppContextType extends AppState {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addCategory: (category: Omit<Category, 'id'>) => Promise<void>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  importData: (data: { transactions: Transaction[]; categories: Category[] }) => Promise<void>;
  refreshStorageInfo: () => Promise<void>;
}

type Action =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_DATA'; payload: { transactions: Transaction[]; categories: Category[] } }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: { id: string; updates: Partial<Transaction> } }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: { id: string; updates: Partial<Category> } }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_STORAGE_INFO'; payload: AppState['storageInfo'] };

const initialState: AppState = {
  transactions: [],
  categories: defaultCategories,
  isLoading: true,
};

const appReducer = (state: AppState, action: Action): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_DATA':
      return {
        ...state,
        transactions: action.payload.transactions,
        categories: action.payload.categories.length > 0 ? action.payload.categories : defaultCategories,
        isLoading: false,
      };
    case 'ADD_TRANSACTION':
      return {
        ...state,
        transactions: [...state.transactions, action.payload],
      };
    case 'UPDATE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.map(t =>
          t.id === action.payload.id ? { ...t, ...action.payload.updates } : t
        ),
      };
    case 'DELETE_TRANSACTION':
      return {
        ...state,
        transactions: state.transactions.filter(t => t.id !== action.payload),
      };
    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.payload],
      };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map(c =>
          c.id === action.payload.id ? { ...c, ...action.payload.updates } : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(c => c.id !== action.payload),
      };
    case 'SET_STORAGE_INFO':
      return {
        ...state,
        storageInfo: action.payload,
      };
    default:
      return state;
  }
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [initError, setInitError] = useState<string | null>(null);

  // 初始化数据加载
  useEffect(() => {
    const initializeData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // 从存储服务加载数据
        const data = await storageService.loadData();
        
        // 如果没有分类数据，使用默认分类并保存
        if (data.categories.length === 0) {
          for (const category of defaultCategories) {
            await databaseService.saveCategory(category);
          }
          data.categories = defaultCategories;
        }
        
        dispatch({ type: 'SET_DATA', payload: data });
        
        // 获取存储信息
        const storageInfo = await storageService.getInfo();
        dispatch({ type: 'SET_STORAGE_INFO', payload: storageInfo });
        
        console.log('数据初始化完成:', {
          transactions: data.transactions.length,
          categories: data.categories.length,
          storageInfo
        });
        
      } catch (error) {
        console.error('数据初始化失败:', error);
        setInitError(error instanceof Error ? error.message : '未知错误');
        
        // 初始化失败时使用默认数据
        dispatch({ type: 'SET_DATA', payload: { transactions: [], categories: defaultCategories } });
      }
    };

    initializeData();
  }, []);

  // 添加交易记录
  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    try {
      const newTransaction: Transaction = {
        ...transaction,
        id: generateId(),
        createdAt: new Date().toISOString(),
      };
      
      await databaseService.saveTransaction(newTransaction);
      dispatch({ type: 'ADD_TRANSACTION', payload: newTransaction });
    } catch (error) {
      console.error('添加交易记录失败:', error);
      throw new Error('添加交易记录失败，请重试');
    }
  };

  // 更新交易记录
  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    try {
      await databaseService.updateTransaction(id, updates);
      dispatch({ type: 'UPDATE_TRANSACTION', payload: { id, updates } });
    } catch (error) {
      console.error('更新交易记录失败:', error);
      throw new Error('更新交易记录失败，请重试');
    }
  };

  // 删除交易记录
  const deleteTransaction = async (id: string) => {
    try {
      await databaseService.deleteTransaction(id);
      dispatch({ type: 'DELETE_TRANSACTION', payload: id });
    } catch (error) {
      console.error('删除交易记录失败:', error);
      throw new Error('删除交易记录失败，请重试');
    }
  };

  // 添加分类
  const addCategory = async (category: Omit<Category, 'id'>) => {
    try {
      const newCategory: Category = {
        ...category,
        id: generateId(),
      };
      
      await databaseService.saveCategory(newCategory);
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    } catch (error) {
      console.error('添加分类失败:', error);
      throw new Error('添加分类失败，请重试');
    }
  };

  // 更新分类
  const updateCategory = async (id: string, updates: Partial<Category>) => {
    try {
      await databaseService.updateCategory(id, updates);
      dispatch({ type: 'UPDATE_CATEGORY', payload: { id, updates } });
    } catch (error) {
      console.error('更新分类失败:', error);
      throw new Error('更新分类失败，请重试');
    }
  };

  // 删除分类
  const deleteCategory = async (id: string) => {
    try {
      await databaseService.deleteCategory(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('删除分类失败:', error);
      throw new Error('删除分类失败，请重试');
    }
  };

  // 导入数据
  const importData = async (data: { transactions: Transaction[]; categories: Category[] }) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      await storageService.saveData(data);
      dispatch({ type: 'SET_DATA', payload: data });
      
      // 更新存储信息
      const storageInfo = await storageService.getInfo();
      dispatch({ type: 'SET_STORAGE_INFO', payload: storageInfo });
    } catch (error) {
      console.error('导入数据失败:', error);
      throw new Error('导入数据失败，请重试');
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // 刷新存储信息
  const refreshStorageInfo = async () => {
    try {
      const storageInfo = await storageService.getInfo();
      dispatch({ type: 'SET_STORAGE_INFO', payload: storageInfo });
    } catch (error) {
      console.error('刷新存储信息失败:', error);
    }
  };

  const value: AppContextType = {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    updateCategory,
    deleteCategory,
    importData,
    refreshStorageInfo,
  };

  // 如果有初始化错误，显示错误信息
  if (initError) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fee', 
        border: '1px solid #fcc', 
        borderRadius: '4px',
        margin: '20px',
        color: '#d00'
      }}>
        <h3>数据加载失败</h3>
        <p>错误信息: {initError}</p>
        <p>应用将使用默认数据继续运行，但您的历史数据可能无法访问。</p>
        <button 
          onClick={() => window.location.reload()}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#d00', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          重新加载
        </button>
      </div>
    );
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
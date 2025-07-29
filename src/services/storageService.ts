import { Transaction, Category } from '../types/index.ts';

// 数据库配置
const DB_NAME = 'FinanceTrackerDB';
const DB_VERSION = 1;
const STORES = {
  TRANSACTIONS: 'transactions',
  CATEGORIES: 'categories',
  METADATA: 'metadata'
};

// localStorage 备份键名
const BACKUP_KEYS = {
  TRANSACTIONS: 'finance-tracker-transactions-backup',
  CATEGORIES: 'finance-tracker-categories-backup',
  LAST_SYNC: 'finance-tracker-last-sync'
};

export interface StorageData {
  transactions: Transaction[];
  categories: Category[];
}

class DatabaseService {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  constructor() {
    this.initPromise = this.initDatabase();
  }

  // 初始化数据库
  private async initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('数据库打开失败:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('数据库连接成功');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // 创建交易记录存储
        if (!db.objectStoreNames.contains(STORES.TRANSACTIONS)) {
          const transactionStore = db.createObjectStore(STORES.TRANSACTIONS, { keyPath: 'id' });
          transactionStore.createIndex('date', 'date', { unique: false });
          transactionStore.createIndex('type', 'type', { unique: false });
          transactionStore.createIndex('category', 'category', { unique: false });
        }

        // 创建分类存储
        if (!db.objectStoreNames.contains(STORES.CATEGORIES)) {
          const categoryStore = db.createObjectStore(STORES.CATEGORIES, { keyPath: 'id' });
          categoryStore.createIndex('type', 'type', { unique: false });
          categoryStore.createIndex('name', 'name', { unique: false });
        }

        // 创建元数据存储
        if (!db.objectStoreNames.contains(STORES.METADATA)) {
          db.createObjectStore(STORES.METADATA, { keyPath: 'key' });
        }

        console.log('数据库结构创建完成');
      };
    });
  }

  // 确保数据库已初始化
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.initPromise) {
      await this.initPromise;
    }
    if (!this.db) {
      throw new Error('数据库未初始化');
    }
    return this.db;
  }

  // 保存交易记录
  async saveTransaction(transaction: Transaction): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction_db = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = transaction_db.objectStore(STORES.TRANSACTIONS);
      const request = store.put(transaction);

      request.onsuccess = () => {
        this.backupToLocalStorage('transactions');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有交易记录
  async getAllTransactions(): Promise<Transaction[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readonly');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新交易记录
  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      
      // 先获取现有记录
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existingTransaction = getRequest.result;
        if (existingTransaction) {
          const updatedTransaction = { ...existingTransaction, ...updates };
          const putRequest = store.put(updatedTransaction);
          
          putRequest.onsuccess = () => {
            this.backupToLocalStorage('transactions');
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('交易记录不存在'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 删除交易记录
  async deleteTransaction(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS], 'readwrite');
      const store = transaction.objectStore(STORES.TRANSACTIONS);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.backupToLocalStorage('transactions');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 保存分类
  async saveCategory(category: Category): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORIES], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORIES);
      const request = store.put(category);

      request.onsuccess = () => {
        this.backupToLocalStorage('categories');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 获取所有分类
  async getAllCategories(): Promise<Category[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORIES], 'readonly');
      const store = transaction.objectStore(STORES.CATEGORIES);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  // 更新分类
  async updateCategory(id: string, updates: Partial<Category>): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORIES], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORIES);
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existingCategory = getRequest.result;
        if (existingCategory) {
          const updatedCategory = { ...existingCategory, ...updates };
          const putRequest = store.put(updatedCategory);
          
          putRequest.onsuccess = () => {
            this.backupToLocalStorage('categories');
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('分类不存在'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // 删除分类
  async deleteCategory(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.CATEGORIES], 'readwrite');
      const store = transaction.objectStore(STORES.CATEGORIES);
      const request = store.delete(id);

      request.onsuccess = () => {
        this.backupToLocalStorage('categories');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  // 批量导入数据
  async importData(data: StorageData): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS, STORES.CATEGORIES], 'readwrite');
      
      // 清空现有数据
      const transactionStore = transaction.objectStore(STORES.TRANSACTIONS);
      const categoryStore = transaction.objectStore(STORES.CATEGORIES);
      
      const clearTransactions = transactionStore.clear();
      const clearCategories = categoryStore.clear();
      
      Promise.all([
        new Promise(res => { clearTransactions.onsuccess = () => res(undefined); }),
        new Promise(res => { clearCategories.onsuccess = () => res(undefined); })
      ]).then(() => {
        // 导入新数据
        const promises: Promise<void>[] = [];
        
        data.transactions.forEach(t => {
          promises.push(new Promise((res, rej) => {
            const req = transactionStore.add(t);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          }));
        });
        
        data.categories.forEach(c => {
          promises.push(new Promise((res, rej) => {
            const req = categoryStore.add(c);
            req.onsuccess = () => res();
            req.onerror = () => rej(req.error);
          }));
        });
        
        Promise.all(promises)
          .then(() => {
            this.backupToLocalStorage('both');
            resolve();
          })
          .catch(reject);
      });
      
      transaction.onerror = () => reject(transaction.error);
    });
  }

  // 获取所有数据
  async getAllData(): Promise<StorageData> {
    const [transactions, categories] = await Promise.all([
      this.getAllTransactions(),
      this.getAllCategories()
    ]);
    
    return { transactions, categories };
  }

  // 备份到 localStorage
  private async backupToLocalStorage(type: 'transactions' | 'categories' | 'both'): Promise<void> {
    try {
      if (type === 'transactions' || type === 'both') {
        const transactions = await this.getAllTransactions();
        localStorage.setItem(BACKUP_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
      
      if (type === 'categories' || type === 'both') {
        const categories = await this.getAllCategories();
        localStorage.setItem(BACKUP_KEYS.CATEGORIES, JSON.stringify(categories));
      }
      
      localStorage.setItem(BACKUP_KEYS.LAST_SYNC, new Date().toISOString());
    } catch (error) {
      console.warn('备份到 localStorage 失败:', error);
    }
  }

  // 从 localStorage 恢复数据
  async restoreFromLocalStorage(): Promise<StorageData | null> {
    try {
      const transactionsStr = localStorage.getItem(BACKUP_KEYS.TRANSACTIONS);
      const categoriesStr = localStorage.getItem(BACKUP_KEYS.CATEGORIES);
      
      if (transactionsStr && categoriesStr) {
        const transactions = JSON.parse(transactionsStr);
        const categories = JSON.parse(categoriesStr);
        
        return { transactions, categories };
      }
      
      return null;
    } catch (error) {
      console.error('从 localStorage 恢复数据失败:', error);
      return null;
    }
  }

  // 检查数据完整性并尝试恢复
  async checkAndRecoverData(): Promise<StorageData> {
    try {
      // 尝试从 IndexedDB 获取数据
      const data = await this.getAllData();
      
      // 如果 IndexedDB 数据为空，尝试从 localStorage 恢复
      if (data.transactions.length === 0 && data.categories.length === 0) {
        const backupData = await this.restoreFromLocalStorage();
        if (backupData) {
          console.log('从 localStorage 备份恢复数据');
          await this.importData(backupData);
          return backupData;
        }
      }
      
      return data;
    } catch (error) {
      console.error('IndexedDB 访问失败，尝试从备份恢复:', error);
      
      // IndexedDB 完全无法访问，使用 localStorage 备份
      const backupData = await this.restoreFromLocalStorage();
      if (backupData) {
        return backupData;
      }
      
      // 如果都失败了，返回空数据
      return { transactions: [], categories: [] };
    }
  }

  // 获取存储状态信息
  async getStorageInfo(): Promise<{
    indexedDBAvailable: boolean;
    localStorageAvailable: boolean;
    lastSync: string | null;
    dataCount: { transactions: number; categories: number };
  }> {
    let indexedDBAvailable = true;
    let dataCount = { transactions: 0, categories: 0 };
    
    try {
      const data = await this.getAllData();
      dataCount = {
        transactions: data.transactions.length,
        categories: data.categories.length
      };
    } catch {
      indexedDBAvailable = false;
    }
    
    const localStorageAvailable = typeof Storage !== 'undefined';
    const lastSync = localStorage.getItem(BACKUP_KEYS.LAST_SYNC);
    
    return {
      indexedDBAvailable,
      localStorageAvailable,
      lastSync,
      dataCount
    };
  }

  // 清理数据库
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORES.TRANSACTIONS, STORES.CATEGORIES], 'readwrite');
      
      const clearTransactions = transaction.objectStore(STORES.TRANSACTIONS).clear();
      const clearCategories = transaction.objectStore(STORES.CATEGORIES).clear();
      
      transaction.oncomplete = () => {
        // 同时清理 localStorage 备份
        localStorage.removeItem(BACKUP_KEYS.TRANSACTIONS);
        localStorage.removeItem(BACKUP_KEYS.CATEGORIES);
        localStorage.removeItem(BACKUP_KEYS.LAST_SYNC);
        resolve();
      };
      
      transaction.onerror = () => reject(transaction.error);
    });
  }
}

// 创建单例实例
export const databaseService = new DatabaseService();

// 向后兼容的接口
export const storageService = {
  // 保存所有数据
  async saveData(data: StorageData): Promise<void> {
    await databaseService.importData(data);
  },

  // 加载所有数据
  async loadData(): Promise<StorageData> {
    return await databaseService.checkAndRecoverData();
  },

  // 获取存储信息
  async getInfo() {
    return await databaseService.getStorageInfo();
  },

  // 清理所有数据
  async clear(): Promise<void> {
    await databaseService.clearAllData();
  }
};
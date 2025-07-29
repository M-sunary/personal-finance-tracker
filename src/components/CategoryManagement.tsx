import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Category } from '../types/index.ts';
import { exportToCSV, exportToJSON, importFromJSON } from '../utils/index.ts';
import { Plus, Edit3, Trash2, Save, X, Upload, FileText, Database, Shield, Clock, HardDrive } from 'lucide-react';

const CategoryManagement: React.FC = () => {
  const { 
    categories, 
    transactions, 
    addCategory, 
    updateCategory, 
    deleteCategory,
    importData,
    storageInfo,
    refreshStorageInfo,
    isLoading
  } = useApp();
  
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'expense' as 'income' | 'expense',
    color: '#EF4444',
  });

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.name.trim()) return;

    try {
      setOperationLoading('adding-category');
      await addCategory(newCategory);
      setNewCategory({ name: '', type: 'expense', color: '#EF4444' });
      setShowAddForm(false);
      await refreshStorageInfo();
    } catch (error) {
      console.error('添加分类失败:', error);
      alert('添加分类失败，请重试');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    try {
      setOperationLoading(`updating-${editingCategory.id}`);
      await updateCategory(editingCategory.id, {
        name: editingCategory.name,
        color: editingCategory.color,
      });
      setEditingCategory(null);
      await refreshStorageInfo();
    } catch (error) {
      console.error('更新分类失败:', error);
      alert('更新分类失败，请重试');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (window.confirm('确定要删除这个分类吗？这不会删除相关的交易记录。')) {
      try {
        setOperationLoading(`deleting-${categoryId}`);
        await deleteCategory(categoryId);
        await refreshStorageInfo();
      } catch (error) {
        console.error('删除分类失败:', error);
        alert('删除分类失败，请重试');
      } finally {
        setOperationLoading(null);
      }
    }
  };

  const handleExportCSV = () => {
    exportToCSV(transactions);
  };

  const handleExportJSON = () => {
    exportToJSON({ transactions, categories });
  };

  const handleImportJSON = async (file: File) => {
    try {
      setImportError(null);
      setOperationLoading('importing');
      const data = await importFromJSON(file);
      
      if (window.confirm('导入数据将覆盖当前所有数据，确定要继续吗？')) {
        await importData(data);
        await refreshStorageInfo();
      }
    } catch (error) {
      setImportError(error instanceof Error ? error.message : '导入失败');
    } finally {
      setOperationLoading(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImportJSON(file);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '未知';
    try {
      return new Date(dateString).toLocaleString('zh-CN');
    } catch {
      return '无效日期';
    }
  };

  const defaultColors = {
    income: ['#10B981', '#059669', '#047857', '#065F46', '#064E3B'],
    expense: ['#EF4444', '#DC2626', '#B91C1C', '#991B1B', '#7F1D1D'],
  };

  return (
    <div className="space-y-6">
      {/* 存储状态信息 */}
      {storageInfo && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">存储状态</h2>
            <button
              onClick={refreshStorageInfo}
              className="bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
              disabled={isLoading}
            >
              刷新
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <HardDrive size={20} className="text-blue-600" />
                <span className="font-medium text-blue-800">IndexedDB</span>
              </div>
              <p className={`text-sm ${storageInfo.indexedDBAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {storageInfo.indexedDBAvailable ? '✅ 可用' : '❌ 不可用'}
              </p>
              <p className="text-xs text-gray-600 mt-1">主要存储方式</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Shield size={20} className="text-green-600" />
                <span className="font-medium text-green-800">LocalStorage</span>
              </div>
              <p className={`text-sm ${storageInfo.localStorageAvailable ? 'text-green-600' : 'text-red-600'}`}>
                {storageInfo.localStorageAvailable ? '✅ 可用' : '❌ 不可用'}
              </p>
              <p className="text-xs text-gray-600 mt-1">备份存储</p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <Clock size={20} className="text-gray-600" />
                <span className="font-medium text-gray-800">最后同步</span>
              </div>
              <p className="text-sm text-gray-700">
                {formatDate(storageInfo.lastSync)}
              </p>
              <p className="text-xs text-gray-600 mt-1">备份时间</p>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>数据统计:</span>
              <span className="font-medium">
                交易记录 {storageInfo.dataCount.transactions} 条, 
                分类 {storageInfo.dataCount.categories} 个
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 数据管理 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">数据管理</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 flex items-center space-x-2"
              disabled={operationLoading !== null}
            >
              <FileText size={16} />
              <span>导出CSV</span>
            </button>
            <button
              onClick={handleExportJSON}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
              disabled={operationLoading !== null}
            >
              <Database size={16} />
              <span>导出JSON</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 flex items-center space-x-2"
              disabled={operationLoading !== null}
            >
              <Upload size={16} />
              <span>
                {operationLoading === 'importing' ? '导入中...' : '导入数据'}
              </span>
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          className="hidden"
        />

        {importError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            导入错误: {importError}
          </div>
        )}

        <div className="text-sm text-gray-600">
          <p>• <strong>更安全的存储:</strong> 使用 IndexedDB 作为主要存储，LocalStorage 作为备份</p>
          <p>• <strong>CSV 导出:</strong> 包含所有交易记录，可用于 Excel 等软件分析</p>
          <p>• <strong>JSON 导出:</strong> 包含完整数据（交易记录和分类），可用于备份和恢复</p>
          <p>• <strong>数据安全:</strong> 自动备份到 LocalStorage，防止数据丢失</p>
        </div>
      </div>

      {/* 分类管理 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">分类管理</h2>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 flex items-center space-x-2"
            disabled={operationLoading !== null}
          >
            <Plus size={16} />
            <span>添加分类</span>
          </button>
        </div>

        {showAddForm && (
          <div className="border-2 border-blue-200 rounded-lg p-4 mb-6 bg-blue-50">
            <h3 className="text-lg font-medium mb-4">添加新分类</h3>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    分类名称
                  </label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="请输入分类名称"
                    required
                    disabled={operationLoading === 'adding-category'}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    类型
                  </label>
                  <select
                    value={newCategory.type}
                    onChange={(e) => setNewCategory({ 
                      ...newCategory, 
                      type: e.target.value as 'income' | 'expense',
                      color: e.target.value === 'income' ? '#10B981' : '#EF4444'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={operationLoading === 'adding-category'}
                  >
                    <option value="expense">支出</option>
                    <option value="income">收入</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  颜色
                </label>
                <div className="flex space-x-2">
                  {defaultColors[newCategory.type].map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setNewCategory({ ...newCategory, color })}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                      disabled={operationLoading === 'adding-category'}
                    />
                  ))}
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 flex items-center space-x-2"
                  disabled={operationLoading === 'adding-category'}
                >
                  <Save size={16} />
                  <span>
                    {operationLoading === 'adding-category' ? '保存中...' : '保存'}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategory({ name: '', type: 'expense', color: '#EF4444' });
                  }}
                  className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                  disabled={operationLoading === 'adding-category'}
                >
                  <X size={16} />
                  <span>取消</span>
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-4 text-green-700">收入分类</h3>
            <div className="space-y-2">
              {incomeCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {editingCategory?.id === category.id ? (
                    <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: editingCategory.color }}
                      />
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={operationLoading === `updating-${category.id}`}
                      />
                      <div className="flex space-x-1">
                        {defaultColors.income.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditingCategory({ ...editingCategory, color })}
                            className={`w-6 h-6 rounded-full border ${
                              editingCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            disabled={operationLoading === `updating-${category.id}`}
                          />
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="text-green-600 hover:text-green-800"
                        disabled={operationLoading === `updating-${category.id}`}
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-600 hover:text-gray-800"
                        disabled={operationLoading === `updating-${category.id}`}
                      >
                        <X size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="编辑"
                          disabled={operationLoading !== null}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="删除"
                          disabled={operationLoading !== null}
                        >
                          {operationLoading === `deleting-${category.id}` ? (
                            <span className="text-xs">删除中...</span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-4 text-red-700">支出分类</h3>
            <div className="space-y-2">
              {expenseCategories.map(category => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {editingCategory?.id === category.id ? (
                    <form onSubmit={handleUpdateCategory} className="flex-1 flex items-center space-x-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: editingCategory.color }}
                      />
                      <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={operationLoading === `updating-${category.id}`}
                      />
                      <div className="flex space-x-1">
                        {defaultColors.expense.map(color => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditingCategory({ ...editingCategory, color })}
                            className={`w-6 h-6 rounded-full border ${
                              editingCategory.color === color ? 'border-gray-800' : 'border-gray-300'
                            }`}
                            style={{ backgroundColor: color }}
                            disabled={operationLoading === `updating-${category.id}`}
                          />
                        ))}
                      </div>
                      <button
                        type="submit"
                        className="text-green-600 hover:text-green-800"
                        disabled={operationLoading === `updating-${category.id}`}
                      >
                        <Save size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="text-gray-600 hover:text-gray-800"
                        disabled={operationLoading === `updating-${category.id}`}
                      >
                        <X size={16} />
                      </button>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => setEditingCategory(category)}
                          className="p-1 text-gray-400 hover:text-blue-500"
                          title="编辑"
                          disabled={operationLoading !== null}
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id)}
                          className="p-1 text-gray-400 hover:text-red-500"
                          title="删除"
                          disabled={operationLoading !== null}
                        >
                          {operationLoading === `deleting-${category.id}` ? (
                            <span className="text-xs">删除中...</span>
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryManagement;
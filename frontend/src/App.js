import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Calendar, User, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff, TrendingUp, Clock, Search, Filter } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://client-task-tracker.onrender.com/api';

const apiService = {
  getTasks: async () => {
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
  },

  createTask: async (task) => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to create task');
    return response.json();
  },

  updateTask: async (id, task) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
  },

  deleteTask: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
    return response.json();
  },

  togglePayment: async (id) => {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/toggle-payment`, {
      method: 'PATCH',
    });
    if (!response.ok) throw new Error('Failed to toggle payment status');
    return response.json();
  }
};

const TaskTracker = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [formData, setFormData] = useState({
    clientName: '',
    taskDescription: '',
    dateCommissioned: '',
    dateDelivered: '',
    expectedAmount: '',
    isPaid: false
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await apiService.getTasks();
      setTasks(data);
    } catch (err) {
      setError('Failed to load tasks. Please check your connection and try again.');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      taskDescription: '',
      dateCommissioned: '',
      dateDelivered: '',
      expectedAmount: '',
      isPaid: false
    });
    setEditingTask(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isOnline) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    try {
      setError('');
      const taskData = {
        ...formData,
        expectedAmount: parseFloat(formData.expectedAmount) || 0
      };

      if (editingTask) {
        await apiService.updateTask(editingTask, taskData);
      } else {
        await apiService.createTask(taskData);
      }
      
      await loadTasks();
      resetForm();
      setShowForm(false);
    } catch (err) {
      setError(`Failed to ${editingTask ? 'update' : 'create'} task. Please try again.`);
      console.error('Error submitting task:', err);
    }
  };

  const handleEdit = (task) => {
    setFormData({
      clientName: task.client_name,
      taskDescription: task.task_description,
      dateCommissioned: task.date_commissioned || '',
      dateDelivered: task.date_delivered || '',
      expectedAmount: task.expected_amount.toString(),
      isPaid: task.is_paid
    });
    setEditingTask(task.id);
    setShowForm(true);
  };

  const handleDelete = async (taskId) => {
    if (!isOnline) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        setError('');
        await apiService.deleteTask(taskId);
        await loadTasks();
      } catch (err) {
        setError('Failed to delete task. Please try again.');
        console.error('Error deleting task:', err);
      }
    }
  };

  const togglePaymentStatus = async (taskId) => {
    if (!isOnline) {
      setError('You are offline. Please check your internet connection.');
      return;
    }

    try {
      setError('');
      await apiService.togglePayment(taskId);
      await loadTasks();
    } catch (err) {
      setError('Failed to update payment status. Please try again.');
      console.error('Error toggling payment:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Not set';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Analytics calculations
  const totalExpected = tasks.reduce((sum, task) => sum + parseFloat(task.expected_amount || 0), 0);
  const totalPaid = tasks.filter(task => task.is_paid).reduce((sum, task) => sum + parseFloat(task.expected_amount || 0), 0);
  const totalPending = totalExpected - totalPaid;
  const paidCount = tasks.filter(task => task.is_paid).length;
  const pendingCount = tasks.filter(task => !task.is_paid).length;
  const paymentRate = tasks.length > 0 ? ((paidCount / tasks.length) * 100).toFixed(1) : 0;

  // Filtering logic
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.task_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'paid' && task.is_paid) ||
      (filterStatus === 'pending' && !task.is_paid);
    
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600"></div>
              <span className="ml-4 text-lg text-gray-600 font-medium">Loading your tasks...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Client Task Tracker</h1>
              <p className="text-indigo-100 text-sm md:text-base">Manage your client projects and track payments</p>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                isOnline ? 'bg-green-500/20 text-green-100' : 'bg-red-500/20 text-red-100'
              }`}>
                {isOnline ? <Wifi size={18} /> : <WifiOff size={18} />}
                <span className="font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  setShowForm(true);
                }}
                disabled={!isOnline}
                className={`px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all transform hover:scale-105 ${
                  isOnline 
                    ? 'bg-white text-indigo-600 hover:shadow-lg' 
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Add Task</span>
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="font-semibold text-red-800">Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total Expected Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-indigo-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <DollarSign className="text-indigo-600" size={24} />
              </div>
              <TrendingUp className="text-indigo-400" size={20} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Expected</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpected)}</p>
            <p className="text-xs text-gray-500 mt-1">{tasks.length} total tasks</p>
          </div>

          {/* Total Paid Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="text-green-600" size={24} />
              </div>
              <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                {paymentRate}%
              </span>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Total Paid</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
            <p className="text-xs text-gray-500 mt-1">{paidCount} paid tasks</p>
          </div>

          {/* Pending Payment Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Clock className="text-orange-600" size={24} />
              </div>
              <XCircle className="text-orange-400" size={20} />
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Pending Payment</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalPending)}</p>
            <p className="text-xs text-gray-500 mt-1">{pendingCount} pending tasks</p>
          </div>

          {/* Active Clients Card */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 transform transition-all hover:scale-105 hover:shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-3 bg-purple-100 rounded-lg">
                <User className="text-purple-600" size={24} />
              </div>
            </div>
            <h3 className="text-gray-600 text-sm font-medium mb-1">Active Clients</h3>
            <p className="text-2xl font-bold text-gray-900">
              {new Set(tasks.map(t => t.client_name)).size}
            </p>
            <p className="text-xs text-gray-500 mt-1">Unique clients</p>
          </div>
        </div>

        {/* Task Form */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              {editingTask ? <Edit2 size={24} className="text-indigo-600" /> : <Plus size={24} className="text-indigo-600" />}
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Client Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                    required
                    placeholder="Enter client name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Expected Amount <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-3.5 text-gray-400" size={18} />
                    <input
                      type="number"
                      step="0.01"
                      value={formData.expectedAmount}
                      onChange={(e) => setFormData({...formData, expectedAmount: e.target.value})}
                      className="w-full pl-10 p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                      required
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({...formData, taskDescription: e.target.value})}
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  rows={3}
                  required
                  placeholder="Describe the task or project..."
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Commissioned
                  </label>
                  <input
                    type="date"
                    value={formData.dateCommissioned}
                    onChange={(e) => setFormData({...formData, dateCommissioned: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Date Delivered
                  </label>
                  <input
                    type="date"
                    value={formData.dateDelivered}
                    onChange={(e) => setFormData({...formData, dateDelivered: e.target.value})}
                    className="w-full p-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({...formData, isPaid: e.target.checked})}
                  className="w-5 h-5 text-indigo-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-indigo-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-gray-700 cursor-pointer">
                  Mark as paid
                </label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  {editingTask ? 'Update Task' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by client name or task description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={20} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium"
            >
              <option value="all">All Tasks</option>
              <option value="paid">Paid Only</option>
              <option value="pending">Pending Only</option>
            </select>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-16 px-4">
              <div className="inline-block p-6 bg-indigo-50 rounded-full mb-4">
                <User size={48} className="text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">
                {tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}
              </h3>
              <p className="text-gray-500 mb-6">
                {tasks.length === 0 
                  ? 'Add your first client task to get started tracking your projects.' 
                  : 'Try adjusting your search or filter criteria.'}
              </p>
              {tasks.length === 0 && (
                <button
                  onClick={() => {
                    resetForm();
                    setShowForm(true);
                  }}
                  disabled={!isOnline}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all transform hover:scale-105"
                >
                  <Plus size={20} className="inline mr-2" />
                  Add Your First Task
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Client & Task
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Timeline
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-indigo-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-100 rounded-lg">
                            <User size={18} className="text-indigo-600" />
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">{task.client_name}</div>
                            <div className="text-sm text-gray-600 mt-1">{task.task_description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar size={14} className="text-indigo-400" />
                            <span className="font-medium">Start:</span>
                            <span>{formatDate(task.date_commissioned)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle size={14} className="text-green-400" />
                            <span className="font-medium">End:</span>
                            <span>{formatDate(task.date_delivered)}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(task.expected_amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => togglePaymentStatus(task.id)}
                          disabled={!isOnline}
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all transform hover:scale-105 ${
                            task.is_paid
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                          } ${!isOnline && 'opacity-50 cursor-not-allowed'}`}
                        >
                          {task.is_paid ? (
                            <>
                              <CheckCircle size={14} />
                              Paid
                            </>
                          ) : (
                            <>
                              <Clock size={14} />
                              Pending
                            </>
                          )}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(task)}
                            disabled={!isOnline}
                            className={`p-2 rounded-lg transition-all ${
                              isOnline
                                ? 'text-indigo-600 hover:bg-indigo-100'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title="Edit task"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            disabled={!isOnline}
                            className={`p-2 rounded-lg transition-all ${
                              isOnline
                                ? 'text-red-600 hover:bg-red-100'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            title="Delete task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer with Refresh Button */}
        <div className="flex justify-center">
          <button
            onClick={loadTasks}
            disabled={loading || !isOnline}
            className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all transform hover:scale-105 ${
              isOnline && !loading
                ? 'bg-white text-indigo-600 hover:shadow-lg border-2 border-indigo-200'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-indigo-200 border-t-indigo-600"></div>
                Refreshing...
              </>
            ) : (
              <>
                <TrendingUp size={20} />
                Refresh Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTracker;
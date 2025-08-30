import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, DollarSign, Calendar, User, CheckCircle, XCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://client-task-tracker.onrender.com/api'; // <-- uses backend in prod

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
    return new Date(dateStr).toLocaleDateString();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const totalExpected = tasks.reduce((sum, task) => sum + parseFloat(task.expected_amount || 0), 0);
  const totalPaid = tasks.filter(task => task.is_paid).reduce((sum, task) => sum + parseFloat(task.expected_amount || 0), 0);
  const totalPending = totalExpected - totalPaid;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Loading tasks...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold text-gray-800">Client Task Tracker</h1>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
              isOnline ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            disabled={!isOnline}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isOnline 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Plus size={20} />
            Add New Task
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <AlertCircle className="text-red-400" size={20} />
              <div className="ml-3">
                <p className="text-red-700">{error}</p>
                <button
                  onClick={() => setError('')}
                  className="text-red-600 hover:text-red-800 text-sm underline mt-1"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <DollarSign className="text-blue-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Expected</p>
                <p className="text-xl font-bold text-blue-600">{formatCurrency(totalExpected)}</p>
              </div>
            </div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border-l-4 border-green-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Total Paid</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
              </div>
            </div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg border-l-4 border-orange-500">
            <div className="flex items-center gap-2">
              <XCircle className="text-orange-600" size={24} />
              <div>
                <p className="text-sm text-gray-600">Pending Payment</p>
                <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
              </div>
            </div>
          </div>
        </div>

        {showForm && (
          <div className="bg-gray-50 p-6 rounded-lg mb-6 border">
            <h2 className="text-xl font-semibold mb-4">
              {editingTask ? 'Edit Task' : 'Add New Task'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expected Amount *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.expectedAmount}
                  onChange={(e) => setFormData({...formData, expectedAmount: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Description *
                </label>
                <textarea
                  value={formData.taskDescription}
                  onChange={(e) => setFormData({...formData, taskDescription: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Commissioned
                </label>
                <input
                  type="date"
                  value={formData.dateCommissioned}
                  onChange={(e) => setFormData({...formData, dateCommissioned: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date Delivered
                </label>
                <input
                  type="date"
                  value={formData.dateDelivered}
                  onChange={(e) => setFormData({...formData, dateDelivered: e.target.value})}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPaid"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({...formData, isPaid: e.target.checked})}
                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                  Payment Received
                </label>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleSubmit}
                disabled={!isOnline}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  isOnline
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {editingTask ? 'Update Task' : 'Add Task'}
              </button>
              <button
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          {tasks.length === 0 ? (
            <div className="text-center py-12">
              <User size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-500 mb-2">No tasks yet</h3>
              <p className="text-gray-400">Add your first client task to get started.</p>
            </div>
          ) : (
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client & Task
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dates
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Status
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tasks.map((task) => (
                  <tr key={task.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{task.client_name}</div>
                        <div className="text-sm text-gray-500">{task.task_description}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        <div className="flex items-center gap-1 mb-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">Commissioned:</span>
                          <span>{formatDate(task.date_commissioned)}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-400" />
                          <span className="text-xs text-gray-500">Delivered:</span>
                          <span>{formatDate(task.date_delivered)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(task.expected_amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => togglePaymentStatus(task.id)}
                        disabled={!isOnline}
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          task.is_paid
                            ? `bg-green-100 text-green-800 ${isOnline ? 'hover:bg-green-200' : 'cursor-not-allowed'}`
                            : `bg-red-100 text-red-800 ${isOnline ? 'hover:bg-red-200' : 'cursor-not-allowed'}`
                        }`}
                      >
                        {task.is_paid ? (
                          <>
                            <CheckCircle size={14} className="mr-1" />
                            Paid
                          </>
                        ) : (
                          <>
                            <XCircle size={14} className="mr-1" />
                            Unpaid
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(task)}
                          disabled={!isOnline}
                          className={`transition-colors ${
                            isOnline 
                              ? 'text-blue-600 hover:text-blue-800' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(task.id)}
                          disabled={!isOnline}
                          className={`transition-colors ${
                            isOnline 
                              ? 'text-red-600 hover:text-red-800' 
                              : 'text-gray-400 cursor-not-allowed'
                          }`}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex justify-center">
          <button
            onClick={loadTasks}
            disabled={loading || !isOnline}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
              isOnline && !loading
                ? 'bg-gray-600 hover:bg-gray-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              'Refresh'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TaskTracker;
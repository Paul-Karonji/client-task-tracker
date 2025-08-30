const Task = require('../models/Task');

class TaskController {
  static async getAllTasks(req, res) {
    try {
      const tasks = await Task.findAll();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch tasks'
      });
    }
  }

  static async createTask(req, res) {
    try {
      const task = await Task.create(req.body);
      res.status(201).json(task);
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create task'
      });
    }
  }

  static async updateTask(req, res) {
    try {
      const existingTask = await Task.findById(req.params.id);
      
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const updatedTask = await Task.update(req.params.id, req.body);
      res.json(updatedTask);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update task'
      });
    }
  }

  static async deleteTask(req, res) {
    try {
      const existingTask = await Task.findById(req.params.id);
      
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      await Task.delete(req.params.id);
      res.json({
        success: true,
        message: 'Task deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete task'
      });
    }
  }

  static async togglePayment(req, res) {
    try {
      const existingTask = await Task.findById(req.params.id);
      
      if (!existingTask) {
        return res.status(404).json({
          success: false,
          message: 'Task not found'
        });
      }

      const updatedTask = await Task.togglePayment(req.params.id);
      res.json(updatedTask);
    } catch (error) {
      console.error('Error toggling payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update payment status'
      });
    }
  }
}

module.exports = TaskController;
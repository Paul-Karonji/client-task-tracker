const express = require('express');
const router = express.Router();
const TaskController = require('../controllers/taskController');
const { validateTask, validateId } = require('../middleware/validation');

router.get('/', TaskController.getAllTasks);
router.post('/', validateTask, TaskController.createTask);
router.put('/:id', validateId, validateTask, TaskController.updateTask);
router.patch('/:id/toggle-payment', validateId, TaskController.togglePayment);
router.delete('/:id', validateId, TaskController.deleteTask);

module.exports = router;
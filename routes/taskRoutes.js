const express = require('express');
const router = express.Router();
const { createTask, listTasks, getTask, updateTask, deleteTask, bulkCreate } = require('../controllers/taskController');
const auth = require('../middleware/auth');

router.post('/', auth, createTask);
router.get('/', auth, listTasks);
router.get('/:id', auth, getTask);
router.put('/:id', auth, updateTask);
router.delete('/:id', auth, deleteTask);
router.post('/bulk', auth, bulkCreate);

module.exports = router;
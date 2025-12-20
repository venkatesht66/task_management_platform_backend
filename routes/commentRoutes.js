const express = require('express');
const router = express.Router();
const { addComment, getComments, updateComment, deleteComment } = require('../controllers/commentController');
const auth = require('../middleware/auth');

router.post('/tasks/:taskId', auth, addComment);
router.get('/tasks/:taskId', auth, getComments);
router.put('/:id', auth, updateComment);
router.delete('/:id', auth, deleteComment);

module.exports = router;
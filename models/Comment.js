const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true 
  },
  authorId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  },
  body: { 
    type: String,
    required: true
  },
  parentId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null 
  },
  deletedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema);
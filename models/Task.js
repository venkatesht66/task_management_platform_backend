const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String,
    required: true,
    trim: true
  },
  description: String,
  status: { 
    type: String,
    enum: ['open', 'in_progress', 'done', 'archived'],
    default: 'open'
  },
  priority: { 
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  dueDate: Date,
  tags: [String],
  assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deletedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  taskId: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    required: true 
  },
  uploadedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User' 
  },
  filename: String,
  mimeType: String,
  sizeBytes: Number,
  storagePath: String,
  deletedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('File', fileSchema);
const Comment = require('../models/Comment');
const Task = require('../models/Task');
const xss = require('xss');

const addComment = async (req, res) => {
  try {
    const { body, parentId } = req.body;
    const taskId = req.params.taskId;

    if (!body || !body.trim()) {
      return res.status(400).json({ ok: false, error: "Comment body required" });
    }

    const task = await Task.findOne({
      _id: taskId,
      deletedAt: null,
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    });

    if (!task) {
      return res.status(403).json({ ok: false, error: "Access denied for this task" });
    }

    const comment = await Comment.create({
      taskId,
      authorId: req.user.id,
      body: xss(body),
      parentId: parentId || null,
    });

    res.status(201).json({ ok: true, data: comment });
  } catch (err) {
    console.error("Add comment error:", err);
    res.status(500).json({ ok: false, error: "Failed to add comment" });
  }
};

const getComments = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const task = await Task.findOne({
      _id: taskId,
      deletedAt: null,
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    });

    if (!task) {
      return res.status(403).json({ ok: false, error: "Access denied" });
    }

    const comments = await Comment.find({
      taskId,
      deletedAt: null,
    }).sort({ createdAt: 1 });

    res.json({ ok: true, data: comments });
  } catch (err) {
    console.error("Get comments error:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch comments" });
  }
};

const updateComment = async (req, res) => {
  try {
    const id = req.params.id;
    const { body } = req.body;

    if (!body || !body.trim()) {
      return res.status(400).json({ ok: false, error: "Body required" });
    }

    const comment = await Comment.findById(id);
    if (!comment || comment.deletedAt) {
      return res.status(404).json({ ok: false, error: "Comment not found" });
    }

    const task = await Task.findOne({
      _id: comment.taskId,
      deletedAt: null,
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    });

    if (!task) {
      return res.status(403).json({ ok: false, error: "Access denied for this comment" });
    }

    if (comment.authorId.toString() !== req.user.id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "You can only edit your own comment" });
    }

    comment.body = xss(body);
    await comment.save();

    res.json({ ok: true, data: comment });
  } catch (err) {
    console.error("Update comment error:", err);
    res.status(500).json({ ok: false, error: "Failed to update comment" });
  }
};

const deleteComment = async (req, res) => {
  try {
    const id = req.params.id;

    const comment = await Comment.findById(id);
    if (!comment || comment.deletedAt) {
      return res.status(404).json({ ok: false, error: "Comment not found" });
    }

    const task = await Task.findOne({
      _id: comment.taskId,
      deletedAt: null,
      $or: [{ createdBy: req.user.id }, { assignedTo: req.user.id }],
    });

    if (!task) {
      return res.status(403).json({ ok: false, error: "Access denied for this comment" });
    }

    if (comment.authorId.toString() !== req.user.id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ ok: false, error: "You can only delete your own comment" });
    }

    comment.deletedAt = new Date();
    await comment.save();

    res.status(200).json({ ok: true, message: "Comment deleted" });
  } catch (err) {
    console.error("Delete comment error:", err);
    res.status(500).json({ ok: false, error: "Failed to delete comment" });
  }
};

module.exports = { addComment, getComments, updateComment, deleteComment };
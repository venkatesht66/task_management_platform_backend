const Task = require('../models/Task');
const xss = require('xss');
const mongoose = require('mongoose');

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, tags = [], assignedTo = [] } = req.body;

    if (!title) return res.status(400).json({ ok: false, error: 'Title is required' });

    const task = new Task({
      title: xss(title),
      description: xss(description || ''),
      status: status || undefined,
      priority: priority || undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      tags,
      assignedTo: assignedTo.map(id => new mongoose.Types.ObjectId(id)),
      createdBy: req.user?.id || null
    });

    await task.save();

    res.status(201).json({
      message: 'Task created successfully',
      task: {
        id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority
      }
    });
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ ok: false, error: 'Server error' });
  }
};

const listTasks = async (req, res) => {
  try {
    const { page = 1, limit = 20, q, status, priority, tag, assigned } = req.query;

    const accessFilter = {
      $or: [
        { createdBy: req.user.id },
        { assignedTo: req.user.id }
      ]
    };

    const searchFilter = { deletedAt: null };

    if (status) searchFilter.status = status;
    if (priority) searchFilter.priority = priority;
    if (tag) searchFilter.tags = tag;
    if (assigned) searchFilter.assignedTo = assigned;

    const filter = {
      ...searchFilter,
      ...accessFilter,
    };

    if (q) {
      filter.$and = [
        accessFilter,
        {
          $or: [
            { title: { $regex: q, $options: "i" } },
            { description: { $regex: q, $options: "i" } },
          ],
        },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const tasks = await Task.find(filter)
      .populate("createdBy", "fullName email")
      .populate("assignedTo", "fullName email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.json({
      ok: true,
      data: tasks,
      meta: { total, page: parseInt(page), limit: parseInt(limit) },
    });
  } catch (err) {
    console.error("List tasks error:", err);
    res.status(500).json({ ok: false, error: "List tasks failed" });
  }
};

const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("assignedTo", "name email");

    if (!task || task.deletedAt)
      return res.status(404).json({ ok: false, error: "Task not found" });

    const canAccess =
      task.createdBy?._id?.toString() === req.user.id.toString() ||
      task.assignedTo.some(
        (u) => u._id.toString() === req.user.id.toString()
      );

    if (!canAccess)
      return res.status(403).json({ ok: false, error: "Forbidden" });

    res.json({ ok: true, data: task });
  } catch (err) {
    console.error("Get task error:", err);
    res.status(500).json({ ok: false, error: "Get task failed" });
  }
};

const updateTask = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findById(id);

    if (!task || task.deletedAt)
      return res.status(404).json({ ok: false, error: "Task not found" });

    const canAccess =
      task.createdBy?.toString() === req.user.id.toString() ||
      task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );

    if (!canAccess)
      return res.status(403).json({ ok: false, error: "Forbidden" });

    const allowed = [
      "title",
      "description",
      "status",
      "priority",
      "dueDate",
      "tags",
      "assignedTo",
    ];

    allowed.forEach((key) => {
      if (req.body[key] !== undefined) {
        task[key] = req.body[key];
      }
    });

    await task.save();

    res.json({ ok: true, data: task });
  } catch (err) {
    console.error("Update task error:", err);
    res.status(500).json({ ok: false, error: "Update failed" });
  }
};

const deleteTask = async (req, res) => {
  try {
    const id = req.params.id;
    const task = await Task.findById(id);

    if (!task || task.deletedAt)
      return res.status(404).json({ ok: false, error: "Task not found" });

    const canAccess =
      task.createdBy?.toString() === req.user.id.toString() ||
      task.assignedTo.some(
        (u) => u.toString() === req.user.id.toString()
      );

    if (!canAccess)
      return res.status(403).json({ ok: false, error: "Forbidden" });

    task.deletedAt = new Date();
    await task.save();

    res.status(200).json({ ok: true, message: "Task deleted" });
  } catch (err) {
    console.error("Delete task error:", err);
    res.status(500).json({ ok: false, error: "Delete failed" });
  }
};

const bulkCreate = async (req, res) => {
  try {
    const { tasks } = req.body;
    if (!Array.isArray(tasks) || tasks.length === 0) {
      return res
        .status(400)
        .json({ ok: false, error: "Tasks must be a non-empty array" });
    }

    const created = [];
    const errors = [];

    for (let i = 0; i < tasks.length; i++) {
      const t = tasks[i];

      if (!t.title) {
        errors.push({ index: i, reason: "Title required" });
        continue;
      }

      const newTaskData = {
        title: xss(t.title),
        description: xss(t.description || ""),
        status: t.status || "open",
        priority: t.priority || "medium",
        dueDate: t.dueDate ? new Date(t.dueDate) : undefined,
        tags: Array.isArray(t.tags) ? t.tags : [],
        assignedTo: Array.isArray(t.assignedTo)
          ? t.assignedTo.map((id) => new mongoose.Types.ObjectId(id))
          : [],
        createdBy: req.user.id,
      };

      const newTask = await Task.create(newTaskData);
      created.push({
        id: newTask._id,
        title: newTask.title,
        status: newTask.status,
      });
    }

    res.status(201).json({
      ok: true,
      message: "Bulk create completed",
      createdCount: created.length,
      failedCount: errors.length,
      created,
      errors,
    });
  } catch (err) {
    console.error("Bulk create error:", err);
    res.status(500).json({ ok: false, error: "Bulk create failed" });
  }
};

module.exports = { createTask, listTasks, getTask, updateTask, deleteTask, bulkCreate };
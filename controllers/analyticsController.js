const Task = require('../models/Task');
const mongoose = require('mongoose');

const overview = async (req, res) => {
  try {
    const userId = req.user.id;

    const matchFilter = {
      deletedAt: null,
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { assignedTo: new mongoose.Types.ObjectId(userId) },
      ],
    };

    const byStatus = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    const byPriority = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } },
    ]);

    res.json({ ok: true, data: { byStatus, byPriority } });
  } catch (err) {
    console.error('Overview error:', err);
    res.status(500).json({ ok: false, error: 'Overview failed' });
  }
};

const userPerformance = async (req, res) => {
  try {
    const userId = req.params.userId;

    if (req.user.role !== 'admin' && req.user.id.toString() !== userId.toString()) {
      return res.status(403).json({ ok: false, error: 'Forbidden: Cannot access another user performance' });
    }

    const matchFilter = {
      deletedAt: null,
      assignedTo: new mongoose.Types.ObjectId(userId),
    };

    const completed = await Task.countDocuments({
      ...matchFilter,
      status: 'done',
    });

    const overdue = await Task.countDocuments({
      ...matchFilter,
      status: { $ne: 'done' },
      dueDate: { $lt: new Date() },
    });

    res.json({
      ok: true,
      data: { tasksCompleted: completed, overdue },
    });
  } catch (err) {
    console.error('User performance error:', err);
    res.status(500).json({ ok: false, error: 'User performance failed' });
  }
};

const trends = async (req, res) => {
  try {
    const userId = req.user.id;
    const { from, to, granularity = 'day' } = req.query;

    const fromDate = from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to) : new Date();

    const groupFormat = {
      day: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
      week: { $dateToString: { format: '%Y-%U', date: '$createdAt' } },
      month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
    }[granularity];

    const matchFilter = {
      deletedAt: null,
      createdAt: { $gte: fromDate, $lte: toDate },
      $or: [
        { createdBy: new mongoose.Types.ObjectId(userId) },
        { assignedTo: new mongoose.Types.ObjectId(userId) },
      ],
    };

    const rows = await Task.aggregate([
      { $match: matchFilter },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    res.json({ ok: true, data: rows });
  } catch (err) {
    console.error('Trends error:', err);
    res.status(500).json({ ok: false, error: 'Trends failed' });
  }
};

module.exports = { overview, userPerformance, trends };
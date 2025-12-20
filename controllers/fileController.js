const File = require("../models/File");
const Task = require("../models/Task");
const path = require("path");
const fs = require("fs");

const canAccessTask = async (taskId, userId) => {
  const task = await Task.findById(taskId);
  if (!task) return false;

  const isCreator = task.createdBy?.toString() === userId.toString();
  const isAssigned = task.assignedTo?.some(
    (u) => u.toString() === userId.toString()
  );

  return isCreator || isAssigned;
};

const uploadFiles = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const hasAccess = await canAccessTask(taskId, req.user.id);
    if (!hasAccess)
      return res.status(403).json({ ok: false, error: "Forbidden: No access to this task" });

    if (!req.files || req.files.length === 0)
      return res.status(400).json({ ok: false, error: "No files uploaded" });

    const saved = [];

    for (const f of req.files) {
      const relativePath = path.join("uploads", taskId, f.filename);

      const meta = await File.create({
        taskId,
        uploadedBy: req.user.id,
        filename: f.originalname,
        mimeType: f.mimetype,
        sizeBytes: f.size,
        storagePath: relativePath,
      });
      saved.push(meta);
    }

    res.status(201).json({ ok: true, data: saved });
  } catch (err) {
    console.error("Upload files error:", err);
    res.status(500).json({ ok: false, error: "Upload failed" });
  }
};

const getTaskFiles = async (req, res) => {
  try {
    const taskId = req.params.taskId;

    const hasAccess = await canAccessTask(taskId, req.user.id);
    if (!hasAccess)
      return res.status(403).json({ ok: false, error: "Forbidden: No access to this task" });

    const files = await File.find({
      taskId,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
      .sort({ createdAt: -1 })
      .populate("uploadedBy", "fullName email");

    res.json({ ok: true, data: files });
  } catch (err) {
    console.error("Get task files error:", err);
    res.status(500).json({ ok: false, error: "Failed to fetch files" });
  }
};

const downloadFile = async (req, res) => {
  try {
    const f = await File.findById(req.params.id);
    if (!f) return res.status(404).json({ ok: false, error: "File not found" });

    const hasAccess = await canAccessTask(f.taskId, req.user.id);
    if (!hasAccess)
      return res.status(403).json({ ok: false, error: "Forbidden: No access to this file" });

    const fullPath = path.resolve(f.storagePath);
    if (!fs.existsSync(fullPath))
      return res.status(404).json({ ok: false, error: "File missing on disk" });

    res.download(fullPath, f.filename);
  } catch (err) {
    console.error("Download file error:", err);
    res.status(500).json({ ok: false, error: "Download failed" });
  }
};

const deleteFile = async (req, res) => {
  try {
    const f = await File.findById(req.params.id);
    if (!f) return res.status(404).json({ ok: false, error: "File not found" });

    const hasAccess = await canAccessTask(f.taskId, req.user.id);
    if (!hasAccess)
      return res.status(403).json({ ok: false, error: "Forbidden: No access to delete this file" });

    if (f.storagePath && fs.existsSync(f.storagePath)) {
      fs.unlinkSync(f.storagePath);
    }

    f.deletedAt = new Date();
    await f.save();

    res.status(200).json({ ok: true, message: "File deleted successfully" });
  } catch (err) {
    console.error("Delete file error:", err);
    res.status(500).json({ ok: false, error: "Delete failed" });
  }
};

module.exports = {
  uploadFiles,
  getTaskFiles,
  downloadFile,
  deleteFile,
};
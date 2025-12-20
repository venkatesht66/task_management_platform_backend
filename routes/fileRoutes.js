const express = require("express");
const router = express.Router();
const upload = require("../middleware/upload");
const  auth  = require("../middleware/auth");
const {
  uploadFiles,
  getTaskFiles,
  downloadFile,
  deleteFile,
} = require("../controllers/fileController");

router.post("/upload/:taskId", auth, upload.array("files"), uploadFiles);
router.get("/task/:taskId", auth, getTaskFiles);
router.get("/download/:id", auth, downloadFile);
router.delete("/:id", auth, deleteFile);

module.exports = router;
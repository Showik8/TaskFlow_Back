const express = require("express");
const { protect, adminOnly } = require("../middlewares/authMiddleware");
const {
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskChecklist,
  updateTaskStatus,
  createTask,
  getDashboardData,
  getUserDashboardData,
} = require("../controllers/taskController");

const router = express.Router();

router.get("./dashboard-data", protect, getDashboardData);
router.get("/user-dashboard-data", protect, getUserDashboardData);
router.get("/", protect, getTasks);
router.get("/:id", protect, getTaskById);
router.post("/", adminOnly, createTask);
router.put("/:id", protect, updateTask);
router.delete("/:id", adminOnly, deleteTask);
router.put("/:id/status", protect, updateTaskStatus);
router.put("/:id/todo", protect, updateTaskChecklist);

module.exports = router;

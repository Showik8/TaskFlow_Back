const { json } = require("stream/consumers");
const Task = require("../models/Task");
const { countDocuments } = require("../models/User");

const getTasks = async (req, res) => {
  try {
    const { status } = req.query;
    let filter = {};

    if (status) {
      filter.status = status;
    }

    let tasks;

    if (User.role === "admin") {
      tasks = await Task.find(filter).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    } else {
      tasks = await Task.find({ ...filter, assignedTo: user_id }).populate(
        "assignedTo",
        "name email profileImageUrl"
      );
    }

    tasks = await Promise.all(
      tasks.map(async (task) => {
        const completedCount = task.todoChecklist.filter(
          (item) => item.completed
        ).length;

        return { ...tasks._doc, completedCount: completedCount };
      })
    );

    const allTask = await Task.countDocuments(
      req.user.role === "admin" ? {} : { assignedTo: req.user._id }
    );

    const pendingTasks = await Task.countDocuments({
      ...filter,
      status: "Pending",
      ...(req.user.role != "admin" && { assignedTo: req.user._id }),
    });

    const inProgressTasks = await Task.countDocuments({
      ...filter,
      status: "In Progress",
      ...(req.user.role != "admin" && { assignedTo: req.user._id }),
    });

    const completedTasks = await Task.countDocuments({
      ...filter,
      status: "Completed",
      ...(req.user.role != "admin" && { assignedTo: req.user._id }),
    });

    res.json({
      tasks,
      statusSummary: {
        all: allTask,
        pendingTasks,
        inProgressTasks,
        completedTasks,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    if (task) {
      return res.status(404).json({ message: "Task not Founded <3" });
    }

    res.send(task);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    } = await req.body;

    if (!Array.isArray(assignedTo)) {
      return res.status(400).json({
        message: "assigned To must be an array of users ID",
      });
    }

    const task = await Task.create({
      title,
      description,
      priority,
      dueDate,
      assignedTo,
      attachments,
      todoChecklist,
    });

    res.status(201).json({ message: "Task Created Succesfully", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      res.status(404).json({ message: "Task Not Founded <3" });
    }

    task.title = req.body.title || task.title;
    task.description = req.body.description || task.description;
    task.priority = req.body.priority || task.priority;
    task.dueDate = req.body.dueDate || task.dueDate;
    task.todoChecklist = req.body.todoChecklist || task.todoChecklist;
    task.attachments = req.body.attachments || task.attachments;

    if (req.body.assignedTo) {
      if (Array.isArray(req.body.assignedTo)) {
        res
          .status(400)
          .json({ message: "assigned to must be an array of user IDs" });
      }
      task.assignedTo = req.body.assignedTo;
    }
    const updateTask = await task.save();
    res.json({ message: "Task updated", updateTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404), json({ message: "Task Not Founded <3" });
    }

    await task.deleteOne();
    res.json({ message: "Task Removed Succesfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const updateTaskStatus = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404), json({ message: "Task Not Founded <3" });
    }

    const assigned = task.assignedTo.some(
      (userId) => userId.toString() === req.users._id.toString()
    );

    if (!assigned && req.user.role != "admin") {
      return res.status(403).json({ message: "not authorized" });
    }

    task.status = req.body.status || task.status;

    if (task.status == "Completed") {
      task.todoChecklist.forEach((item) => (item.completed = true));
      task.progress = 100;
    }

    await task.save();
    res.json({ message: "Task status completed ", task });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
const updateTaskChecklist = async (req, res) => {
  try {
    const { todoChecklist } = req.body;
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404), json({ message: "Task Not Founded <3" });
    }

    if (!task.assignedTo.includes(req.user._id) && req.user.role !== "admin") {
      return res.status(403).json({ message: "no authorized to update todos" });
    }
    task.todoChecklist = todoChecklist;

    const completedCount = task.todoChecklist.filter(
      (item) => item.completed
    ).length;

    const totalItem = task.todoChecklist.length;
    task.progress =
      totalItem > 0 ? Math.round((completedCount / totalItem) * 100) : 0;

    if (task.progress === 100) {
      task.status = "Completed";
    } else if (task.progress > 0) {
      task.status = "In Progress";
    } else {
      task.status = "pending";
    }

    await task.save();

    const updateTask = await Task.findById(req.params.id).populate(
      "assignedTo",
      "name email profileImageUrl"
    );

    res.json({ message: "Task Checklist Updated", task: updateTask });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getDashboardData = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: "Completed" });
    const pendingTasks = await Task.countDocuments({ status: "Pending" });
    const overdueTasks = await Task.countDocuments({
      status: { $ne: "Completed" },
      dueDate: { $ln: new Date() },
    });

    const taskStatuses = ["Pending", "In Progresss", "Completed"];
    const taskDistributionRaw = await Task.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g + "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPrioritiesLevelsRaw = await Task.aggregate([
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 },
        },
      },
    ]);
    const taskPrioritiesLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPrioritiesLevelsRaw.find((item) => item._id === priority)?.count ||
        0;
    });

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPrioritiesLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

const getUserDashboardData = async (req, res) => {
  try {
    const userId = req.user._id;
    const totalTasks = await Task.countDocuments({ assignedTo: userId });
    const pendingTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Pending",
    });
    const completedTasks = await Task.countDocuments({
      assignedTo: userId,
      status: "Completed",
    });
    const overdueTasks = await Task.countDocuments({
      assignedTo: userId,
      status: { $ne: "Completed" },
      dueDate: { $ln: new Date() },
    });

    const taskStatuses = ["Pending", "In Progresss", "Completed"];

    const taskDistributionRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "status", count: { $sum: 1 } } },
    ]);

    const taskDistribution = taskStatuses.reduce((acc, status) => {
      const formattedKey = status.replace(/\s+/g + "");
      acc[formattedKey] =
        taskDistributionRaw.find((item) => item._id === status)?.count || 0;
      return acc;
    }, {});
    taskDistribution["All"] = totalTasks;

    const taskPriorities = ["Low", "Medium", "High"];
    const taskPrioritysLevelsRaw = await Task.aggregate([
      { $match: { assignedTo: userId } },
      { $group: { _id: "status", count: { $sum: 1 } } },
    ]);

    const taskPriorityLevels = taskPriorities.reduce((acc, priority) => {
      acc[priority] =
        taskPrioritysLevelsRaw.find((item) => item._id === priority)?.count ||
        0;
    });

    const recentTasks = await Task.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title status priority dueDate createdAt");

    res.status(200).json({
      statistics: {
        totalTasks,
        pendingTasks,
        completedTasks,
        overdueTasks,
      },
      charts: {
        taskDistribution,
        taskPrioritiesLevels,
      },
      recentTasks,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  getTaskById,
  getTasks,
  updateTask,
  deleteTask,
  updateTaskChecklist,
  updateTaskStatus,
  createTask,
  getDashboardData,
  getUserDashboardData,
};

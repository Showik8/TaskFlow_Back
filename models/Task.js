const mongoose = require("mongoose");
const { type } = require("os");
const { ref } = require("process");

const todoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: String, required: true },
});

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    priority: {
      type: String,
      enum: ["Low", "Medium", "High"],
      default: "Medium",
    },
    status: {
      type: String,
      enum: ["pending", "In Progress", "Completed"],
      default: "Pending",
    },
    dueDate: { type: "Date", requred: true },
    assignedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    attachments: [{ type: String }],
    todoChecklist: [todoSchema],
    progress: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", taskSchema);

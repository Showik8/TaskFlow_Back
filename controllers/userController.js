const Task = require("../models/Task");
const User = require("../models/User");
const bcrypt = require("bcrypt");

const getUsers = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

module.exports = { getUserById, getUsers, deleteUser };

import express from "express";
import mongoose from "mongoose";

import Note from "../models/Note.js";
import User from "../models/User.js";

import authMiddleware from "../middleware/authMiddleware.js";
import adminMiddleware from "../middleware/adminMiddleware.js";

const router = express.Router();

// =====================================================
// GET ADMIN STATISTICS
// GET /api/admin/stats
// =====================================================

router.get(
  "/stats",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();

      const totalAdmins = await User.countDocuments({
        role: "admin",
      });

      const totalRegularUsers = await User.countDocuments({
        role: "user",
      });

      const totalNotes = await Note.countDocuments();

      return res.status(200).json({
        totalUsers,
        totalNotes,
        totalAdmins,
        totalRegularUsers,
      });
    } catch (error) {
      console.error("Admin stats error:", error);

      return res.status(500).json({
        message: "Server error while fetching statistics",
      });
    }
  }
);

// =====================================================
// GET ALL USERS
// GET /api/admin/users
//
// Supports:
// ?search=solen
// ?page=1
// ?limit=10
// =====================================================

router.get(
  "/users",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      let {
        search = "",
        page = 1,
        limit = 10,
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({
          message: "Page must be a positive integer",
        });
      }

      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Limit must be between 1 and 100",
        });
      }

      if (typeof search !== "string") {
        return res.status(400).json({
          message: "Search must be a string",
        });
      }

      search = search.trim();

      const query = {};

      if (search) {
        query.$or = [
          {
            name: {
              $regex: search,
              $options: "i",
            },
          },
          {
            email: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const total = await User.countDocuments(query);

      const users = await User.find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Admin get users error:", error);

      return res.status(500).json({
        message: "Server error while fetching users",
      });
    }
  }
);

// =====================================================
// GET ALL NOTES
// GET /api/admin/notes
//
// Supports:
// ?search=react
// ?page=1
// ?limit=9
// =====================================================

router.get(
  "/notes",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      let {
        search = "",
        page = 1,
        limit = 9,
      } = req.query;

      page = Number(page);
      limit = Number(limit);

      if (!Number.isInteger(page) || page < 1) {
        return res.status(400).json({
          message: "Page must be a positive integer",
        });
      }

      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return res.status(400).json({
          message: "Limit must be between 1 and 100",
        });
      }

      if (typeof search !== "string") {
        return res.status(400).json({
          message: "Search must be a string",
        });
      }

      search = search.trim();

      const query = {};

      if (search) {
        query.$or = [
          {
            title: {
              $regex: search,
              $options: "i",
            },
          },
          {
            content: {
              $regex: search,
              $options: "i",
            },
          },
        ];
      }

      const skip = (page - 1) * limit;

      const total = await Note.countDocuments(query);

      const notes = await Note.find(query)
        .populate("user", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      const totalPages = Math.ceil(total / limit);

      return res.status(200).json({
        notes,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNextPage: page < totalPages,
          hasPreviousPage: page > 1,
        },
      });
    } catch (error) {
      console.error("Admin get notes error:", error);

      return res.status(500).json({
        message: "Server error while fetching notes",
      });
    }
  }
);

// =====================================================
// UPDATE ANY NOTE
// PUT /api/admin/notes/:id
//
// Admin only
// =====================================================

router.put(
  "/notes/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid note ID",
        });
      }

      if (
        typeof title !== "string" ||
        !title.trim()
      ) {
        return res.status(400).json({
          message: "Note title is required",
        });
      }

      if (
        typeof content !== "string" ||
        !content.trim()
      ) {
        return res.status(400).json({
          message: "Note content is required",
        });
      }

      const note = await Note.findByIdAndUpdate(
        id,
        {
          title: title.trim(),
          content: content.trim(),
        },
        {
          new: true,
          runValidators: true,
        }
      ).populate("user", "name email role");

      if (!note) {
        return res.status(404).json({
          message: "Note not found",
        });
      }

      return res.status(200).json({
        message: "Note updated successfully",
        note,
      });
    } catch (error) {
      console.error("Admin update note error:", error);

      return res.status(500).json({
        message: "Server error while updating note",
      });
    }
  }
);

// =====================================================
// DELETE ANY NOTE
// DELETE /api/admin/notes/:id
//
// Admin only
// =====================================================

router.delete(
  "/notes/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          message: "Invalid note ID",
        });
      }

      const note = await Note.findByIdAndDelete(id);

      if (!note) {
        return res.status(404).json({
          message: "Note not found",
        });
      }

      return res.status(200).json({
        message: "Note removed by administrator",
      });
    } catch (error) {
      console.error("Admin delete note error:", error);

      return res.status(500).json({
        message: "Server error while deleting note",
      });
    }
  }
);

export default router;
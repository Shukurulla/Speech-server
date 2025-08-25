// routes/notification.routes.js
import express from "express";
import Notification from "../models/notification.model.js";
import TopicTest from "../models/topic.test.model.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// Get user notifications
router.get("/", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { page = 1, limit = 10, unreadOnly = false } = req.query;

    const query = { userId };
    if (unreadOnly === "true") {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId,
      read: false,
    });

    res.json({
      status: "success",
      data: {
        notifications,
        unreadCount,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Mark notification as read
router.put("/:id/read", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true, readAt: new Date() },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    res.json({
      status: "success",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Mark all notifications as read
router.put("/read-all", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;

    await Notification.updateMany(
      { userId, read: false },
      { read: true, readAt: new Date() }
    );

    res.json({
      status: "success",
      message: "All notifications marked as read",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Delete notification
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: id,
      userId,
    });

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    res.json({
      status: "success",
      message: "Notification deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get notification details and redirect data
router.get("/:id/details", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    const notification = await Notification.findOne({ _id: id, userId });

    if (!notification) {
      return res.status(404).json({
        status: "error",
        message: "Notification not found",
      });
    }

    // Mark as read
    if (!notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      await notification.save();
    }

    // If it's an AI feedback notification, get the test details
    if (notification.type === "ai_feedback" && notification.data?.testId) {
      const topicTest = await TopicTest.findById(notification.data.testId);

      return res.json({
        status: "success",
        data: {
          notification,
          test: topicTest,
          redirectUrl: `/topic-test/${notification.data.testId}`,
        },
      });
    }

    res.json({
      status: "success",
      data: {
        notification,
        redirectUrl: null,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

export default router;

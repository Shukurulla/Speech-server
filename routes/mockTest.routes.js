const express = require("express");
const router = express.Router();
const mockTestController = require("../controllers/mockTestController");
const { adminAuth, userAuth } = require("../middleware/auth");

// Admin routes
router.post(
  "/generate/:gradeId",
  adminAuth,
  mockTestController.generateMockTest
);

// Public routes
router.get("/grade/:gradeId", mockTestController.getMockTestByGrade);

// User routes
router.post("/submit", userAuth, mockTestController.submitMockTestResult);
router.get("/results", userAuth, mockTestController.getUserMockTestResults);

module.exports = router;

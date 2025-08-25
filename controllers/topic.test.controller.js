import TopicTest from "../models/topic.test.model.js";
import TopicTestResult from "../models/TopicTestResult.js";
import { evaluateSpeaking } from "../services/openai.service.js";

// Create topic test
export const createTopicTest = async (req, res) => {
  try {
    const { gradeId, afterLesson, topic, prompt, duration, criteria } =
      req.body;

    // Check if test already exists for this lesson
    const existingTest = await TopicTest.findOne({ gradeId, afterLesson });
    if (existingTest) {
      return res.status(400).json({
        status: "error",
        message: `Topic test already exists for lesson ${afterLesson}`,
      });
    }

    const topicTest = new TopicTest({
      gradeId,
      afterLesson,
      topic,
      prompt,
      duration,
      criteria,
    });

    await topicTest.save();

    res.status(201).json({
      status: "success",
      data: topicTest,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get topic tests by grade
export const getTopicTestsByGrade = async (req, res) => {
  try {
    const { gradeId } = req.params;

    const topicTests = await TopicTest.find({ gradeId, isActive: true }).sort(
      "afterLesson"
    );

    res.status(200).json({
      status: "success",
      data: topicTests,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get topic test by grade and lesson
export const getTopicTestByLesson = async (req, res) => {
  try {
    const { gradeId, lessonNumber } = req.params;

    const topicTest = await TopicTest.findOne({
      gradeId,
      afterLesson: parseInt(lessonNumber),
      isActive: true,
    });

    if (!topicTest) {
      return res.status(404).json({
        status: "error",
        message: "Topic test not found for this lesson",
      });
    }

    res.status(200).json({
      status: "success",
      data: topicTest,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Update topic test
export const updateTopicTest = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const topicTest = await TopicTest.findByIdAndUpdate(
      id,
      { ...updates, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!topicTest) {
      return res.status(404).json({
        status: "error",
        message: "Topic test not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: topicTest,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Delete topic test
export const deleteTopicTest = async (req, res) => {
  try {
    const { id } = req.params;

    const topicTest = await TopicTest.findByIdAndDelete(id);

    if (!topicTest) {
      return res.status(404).json({
        status: "error",
        message: "Topic test not found",
      });
    }

    res.status(200).json({
      status: "success",
      message: "Topic test deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Submit and evaluate topic test
export const evaluateTopicTest = async (req, res) => {
  try {
    const { topicTestId, gradeId, lessonNumber, spokenText, duration } =
      req.body;
    const userId = req.user._id;

    // Get topic test details
    const topicTest = await TopicTest.findById(topicTestId);
    if (!topicTest) {
      return res.status(404).json({
        status: "error",
        message: "Topic test not found",
      });
    }

    // Evaluate with AI (ChatGPT)
    const aiEvaluation = await evaluateSpeaking(
      topicTest.topic,
      topicTest.prompt,
      spokenText,
      topicTest.criteria
    );

    // Save result
    const result = new TopicTestResult({
      userId,
      topicTestId,
      gradeId,
      lessonNumber,
      spokenText,
      aiEvaluation,
      duration,
    });

    await result.save();

    // Populate references for response
    await result.populate("topicTestId");

    res.status(201).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    console.error("Evaluation error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to evaluate test. Please try again.",
    });
  }
};

// Get topic test result by ID
export const getTopicTestResult = async (req, res) => {
  try {
    const { resultId } = req.params;

    const result = await TopicTestResult.findById(resultId)
      .populate("topicTestId")
      .populate("gradeId", "name")
      .populate("userId", "firstName lastName email");

    if (!result) {
      return res.status(404).json({
        status: "error",
        message: "Result not found",
      });
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

// Get user's topic test results
export const getUserTopicTestResults = async (req, res) => {
  try {
    const userId = req.user._id;
    const { gradeId, limit = 10 } = req.query;

    const query = { userId };
    if (gradeId) query.gradeId = gradeId;

    const results = await TopicTestResult.find(query)
      .populate("topicTestId", "topic afterLesson")
      .populate("gradeId", "name")
      .sort("-createdAt")
      .limit(parseInt(limit));

    res.status(200).json({
      status: "success",
      data: results,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
};

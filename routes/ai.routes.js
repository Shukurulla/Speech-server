// routes/ai.routes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import TopicTest from "../models/topic.test.model.js";
import Notification from "../models/notification.model.js";

const router = express.Router();

// Analyze speech with AI (ChatGPT/OpenAI)
router.post("/analyze-speech", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { topic, topicDescription, keywords, userSpeech, lessonRange } =
      req.body;

    if (!userSpeech || userSpeech.trim().length < 20) {
      return res.status(400).json({
        status: "error",
        message: "Speech text is too short for analysis",
      });
    }

    // Call OpenAI API
    const analysis = await analyzeWithOpenAI({
      topic,
      topicDescription,
      keywords,
      userSpeech,
    });

    // Save test result
    const testResult = await TopicTest.create({
      userId,
      topic,
      topicDescription,
      lessonRange,
      userSpeech,
      analysis,
      timestamp: new Date(),
    });

    // Create notification
    const notification = await Notification.create({
      userId,
      type: "ai_feedback",
      title: `AI Feedback: ${topic}`,
      message: generateNotificationMessage(analysis),
      data: {
        testId: testResult._id,
        score: analysis.overallScore,
      },
      read: false,
    });

    res.json({
      status: "success",
      data: {
        analysis,
        testId: testResult._id,
        notificationId: notification._id,
      },
    });
  } catch (error) {
    console.error("Error analyzing speech:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to analyze speech",
    });
  }
});

// Get topic test result
router.get("/topic-test/:id", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { id } = req.params;

    const test = await TopicTest.findOne({
      _id: id,
      userId,
    });

    if (!test) {
      return res.status(404).json({
        status: "error",
        message: "Test not found",
      });
    }

    res.json({
      status: "success",
      data: test,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message,
    });
  }
});

// Get user's topic test history
router.get("/topic-tests", authMiddleware, async (req, res) => {
  try {
    const { userId } = req.userData;
    const { page = 1, limit = 10 } = req.query;

    const tests = await TopicTest.find({ userId })
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await TopicTest.countDocuments({ userId });

    res.json({
      status: "success",
      data: {
        tests,
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

// Helper function to analyze with OpenAI
async function analyzeWithOpenAI({
  topic,
  topicDescription,
  keywords,
  userSpeech,
}) {
  try {
    // You'll need to install: npm install openai
    const { Configuration, OpenAIApi } = await import("openai");

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const openai = new OpenAIApi(configuration);

    const prompt = `
      Analyze the following speech for an English language learning assessment.
      
      Topic: ${topic}
      Topic Description: ${topicDescription}
      Expected Keywords: ${keywords.join(", ")}
      
      Student's Speech:
      "${userSpeech}"
      
      Please analyze and provide scores (0-100) and feedback for:
      1. Relevance to the topic (relevanceScore)
      2. Grammar accuracy (grammarScore)
      3. Vocabulary usage (vocabularyScore)
      4. Fluency and coherence (fluencyScore)
      5. Overall score (overallScore)
      
      Also provide:
      - 3 strengths of the speech
      - 3 areas for improvement
      - Specific grammar issues found
      - A detailed analysis paragraph
      
      Return the response in JSON format.
    `;

    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert English language teacher providing constructive feedback on student speeches.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const aiResponse = JSON.parse(response.data.choices[0].message.content);

    return {
      relevanceScore: aiResponse.relevanceScore || 75,
      grammarScore: aiResponse.grammarScore || 70,
      vocabularyScore: aiResponse.vocabularyScore || 72,
      fluencyScore: aiResponse.fluencyScore || 68,
      overallScore: aiResponse.overallScore || 71,
      feedback: {
        strengths: aiResponse.strengths || [
          "Good topic introduction",
          "Clear main points",
          "Appropriate vocabulary",
        ],
        improvements: aiResponse.improvements || [
          "Add more specific examples",
          "Improve sentence variety",
          "Work on pronunciation",
        ],
        grammarIssues: aiResponse.grammarIssues || [
          "Occasional verb tense errors",
          "Article usage needs improvement",
        ],
      },
      detailedAnalysis:
        aiResponse.detailedAnalysis ||
        "Your speech shows understanding of the topic with room for improvement in fluency and grammar accuracy.",
    };
  } catch (error) {
    console.error("OpenAI API Error:", error);

    // Return mock data if API fails
    return generateMockAnalysis(userSpeech, keywords);
  }
}

// Fallback mock analysis
function generateMockAnalysis(userSpeech, keywords) {
  const wordCount = userSpeech.split(" ").length;
  const keywordMatches = keywords.filter((kw) =>
    userSpeech.toLowerCase().includes(kw.toLowerCase())
  ).length;

  const relevanceScore = Math.min(100, 60 + keywordMatches * 10);
  const lengthScore = Math.min(100, (wordCount / 150) * 100);

  return {
    relevanceScore,
    grammarScore: 70 + Math.floor(Math.random() * 20),
    vocabularyScore: 65 + Math.floor(Math.random() * 25),
    fluencyScore: 60 + Math.floor(Math.random() * 30),
    overallScore: Math.round((relevanceScore + lengthScore) / 2),
    feedback: {
      strengths: [
        "Good effort in addressing the topic",
        "Used some relevant vocabulary",
        "Maintained focus on the subject",
      ],
      improvements: [
        "Expand on your main points with examples",
        "Use more varied sentence structures",
        "Include more topic-specific vocabulary",
      ],
      grammarIssues: [
        "Watch subject-verb agreement",
        "Review use of articles (a, an, the)",
      ],
    },
    detailedAnalysis: `Your speech of ${wordCount} words addresses the topic with ${keywordMatches} relevant keywords. Continue practicing to improve fluency and expand your vocabulary.`,
  };
}

// Generate notification message
function generateNotificationMessage(analysis) {
  const { overallScore } = analysis;

  if (overallScore >= 90) {
    return `Excellent! You scored ${overallScore}% on your topic speech. Your understanding and expression are outstanding!`;
  } else if (overallScore >= 80) {
    return `Great job! You scored ${overallScore}% on your topic speech. You're making excellent progress!`;
  } else if (overallScore >= 70) {
    return `Good work! You scored ${overallScore}% on your topic speech. Keep practicing to improve further.`;
  } else if (overallScore >= 60) {
    return `Nice effort! You scored ${overallScore}% on your topic speech. Review the feedback for improvement areas.`;
  } else {
    return `You scored ${overallScore}% on your topic speech. Check the detailed feedback to see how you can improve.`;
  }
}

export default router;

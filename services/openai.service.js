import axios from "axios";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

export const evaluateSpeaking = async (topic, prompt, spokenText, criteria) => {
  const systemPrompt = `You are an expert English language teacher evaluating a student's speaking response. 
  
  Evaluate based on these weighted criteria:
  1. Relevance to topic (${criteria.relevance}%)
  2. Grammar accuracy (${criteria.grammar}%)
  3. Fluency and coherence (${criteria.fluency}%)
  4. Vocabulary usage (${criteria.vocabulary}%)
  t      {
        "original": "incorrect phrase",
        "corrected": "correct phrase",
        "explanation": "why it's incorrect"
      }
    ],
    "strengths": ["strength1", "strength2"],
    "improvements": ["improvement1", "improvement2"]
  }`;

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4.nano",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Topic: ${topic}\n\nPrompt: ${prompt}\n\nStudent Response: ${spokenText}\n\nPlease evaluate this response.`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" },
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const evaluation = JSON.parse(response.data.choices[0].message.content);

    // Calculate weighted overall score
    const weightedScore =
      (evaluation.relevanceScore * criteria.relevance) / 100 +
      (evaluation.grammarScore * criteria.grammar) / 100 +
      (evaluation.fluencyScore * criteria.fluency) / 100 +
      (evaluation.vocabularyScore * criteria.vocabulary) / 100;

    evaluation.overallScore = Math.round(weightedScore);

    return evaluation;
  } catch (error) {
    console.error("OpenAI API error:", error);

    // Fallback evaluation if API fails
    return {
      relevanceScore: 70,
      grammarScore: 70,
      fluencyScore: 70,
      vocabularyScore: 70,
      overallScore: 70,
      feedback:
        "Your response has been recorded. Please try again later for detailed feedback.",
      corrections: [],
      strengths: ["Response recorded successfully"],
      improvements: ["Detailed feedback will be available soon"],
    };
  }
};

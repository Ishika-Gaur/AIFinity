import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set in environment variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

/**
 * Helper to retry Gemini API calls on temporary 503 / 429 demand spikes
 */
const callWithRetry = async (fn, retries = 2, delayMs = 1500) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      const isRetryable =
        err.message?.includes("503") ||
        err.message?.includes("high demand") ||
        err.message?.includes("429") ||
        err.message?.includes("Resource has been exhausted");

      if (isRetryable && attempt < retries) {
        console.warn(`[Gemini] Model busy (attempt ${attempt + 1}/${retries + 1}), retrying in ${delayMs * (attempt + 1)}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
};

// Candidate Gemini model names to try in order of preference
const MODEL_CANDIDATES = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

/** Schema for generateQuestions output */
const QUESTIONS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    questions: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          question:      { type: SchemaType.STRING },
          options:       { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          correctAnswer: { type: SchemaType.STRING },
          explanation:   { type: SchemaType.STRING },
          difficulty:    { type: SchemaType.STRING },
          topic:         { type: SchemaType.STRING },
        },
        required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topic"],
      },
    },
  },
  required: ["questions"],
};

/** Schema for evaluateAssessmentWithAI output */
const EVALUATION_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    overallFeedback: { type: SchemaType.STRING },
    overallRating: {
      type: SchemaType.STRING,
      enum: ["Excellent", "Good", "Average", "Needs Improvement", "Poor"],
    },
    strengths: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    areasToImprove: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
    },
    questionEvaluations: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          questionId:     { type: SchemaType.STRING },
          aiScore:        { type: SchemaType.NUMBER },
          aiFeedback:     { type: SchemaType.STRING },
          keyPointsMissed: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          status:         { type: SchemaType.STRING, enum: ["correct", "partial", "incorrect"] },
        },
        required: ["questionId", "aiScore", "aiFeedback", "keyPointsMissed", "status"],
      },
    },
  },
  required: ["overallFeedback", "overallRating", "strengths", "areasToImprove", "questionEvaluations"],
};

/** Schema for ConceptRoot diagnostic output */
const CONCEPT_ROOT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    verdict: {
      type: SchemaType.STRING,
      enum: ["Incorrect", "Partially Correct", "Correct", "Correct with Weakness", "Ambiguous"],
    },
    verdictType: {
      type: SchemaType.STRING,
      enum: ["error", "warning", "success", "indigo", "info"],
    },
    whatYouGotRight: { type: SchemaType.STRING },
    whatNeedsAttention: { type: SchemaType.STRING },
    focusFirst: { type: SchemaType.STRING },
    whyYoureGettingStuck: { type: SchemaType.STRING },
    personalizedExplanation: { type: SchemaType.STRING },
    optionalNextStep: { type: SchemaType.STRING },
  },
  required: [
    "verdict",
    "verdictType",
    "whatYouGotRight",
    "whatNeedsAttention",
    "focusFirst",
    "whyYoureGettingStuck",
    "personalizedExplanation",
    "optionalNextStep",
  ],
};

// ---------------------------------------------------------------------------
// Offline Fallback Generators
// ---------------------------------------------------------------------------

const generateFallbackQuestions = (field, topic, difficulty, count) => {
  const sampleBank = [
    {
      question: `In ${topic} (${field}), which of the following best describes the core architectural principle?`,
      options: ["Separation of concerns and modular component design", "Monolithic single-file execution without abstraction", "Direct memory pointer manipulation", "Ignoring asynchronous events and synchronous blocking"],
      correctAnswer: "Separation of concerns and modular component design",
      explanation: "Separation of concerns is a fundamental software design principle that keeps code modular and maintainable.",
      difficulty: difficulty || "Medium",
      topic: topic || field
    }
  ];
  const result = Array.from({ length: count }, (_, i) => ({ ...sampleBank[i % sampleBank.length] }));
  return { questions: result };
};

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export const generateQuestions = async (field, topic, difficulty, count) => {
  const prompt = `You are an expert technical assessor. Generate exactly ${count} multiple-choice questions for ${topic} (${field}) at ${difficulty} level.`;
  
  try {
    const ai = getGenAI();
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = ai.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json", responseSchema: QUESTIONS_SCHEMA } });
        const result = await callWithRetry(() => model.generateContent(prompt));
        return JSON.parse(result.response.text());
      } catch (err) {
        console.warn(`[generateQuestions] ${modelName} failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }
  return generateFallbackQuestions(field, topic, difficulty, count);
};

export const evaluateAssessmentWithAI = async ({ assessmentTitle, assessmentCategory, questions, userAnswers }) => {
  const prompt = `Evaluate the following student assessment: ${assessmentTitle}. Category: ${assessmentCategory}. Total Questions: ${questions.length}`;

  try {
    const ai = getGenAI();
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = ai.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json", responseSchema: EVALUATION_SCHEMA } });
        const result = await callWithRetry(() => model.generateContent(prompt));
        return JSON.parse(result.response.text());
      } catch (err) {
        console.warn(`[evaluateAssessmentWithAI] ${modelName} failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }

  return {
    overallFeedback: "Evaluation completed via local fallback.",
    overallRating: "Average",
    strengths: ["Basic understanding confirmed"],
    areasToImprove: [assessmentCategory],
    questionEvaluations: questions.map((q, i) => ({
      questionId: String(q.id || i), aiScore: 5, aiFeedback: "Completed via fallback.", keyPointsMissed: [], status: "partial"
    }))
  };
};

export const chatCompletion = async (systemPrompt, messages) => {
  const lastMessage = messages[messages.length - 1].content;
  try {
    const ai = getGenAI();
    const history = messages.slice(0, -1).map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const chat = ai.getGenerativeModel({ model: modelName, systemInstruction: systemPrompt }).startChat({ history });
        const result = await callWithRetry(() => chat.sendMessage(lastMessage));
        return result.response.text();
      } catch (err) {
        console.warn(`[chatCompletion] ${modelName} failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("Gemini Chat API Error:", error.message);
  }
  return "I am currently running on local fallback intelligence.";
};

export const analyzeConceptRootWithAI = async (submission) => {
  const prompt = `Analyze this submission: ${submission.text || submission.code}`;
  try {
    const ai = getGenAI();
    for (const modelName of MODEL_CANDIDATES) {
      try {
        const model = ai.getGenerativeModel({ model: modelName, generationConfig: { responseMimeType: "application/json", responseSchema: CONCEPT_ROOT_SCHEMA } });
        const result = await callWithRetry(() => model.generateContent(prompt));
        return JSON.parse(result.response.text());
      } catch (err) {
        console.warn(`[analyzeConceptRootWithAI] ${modelName} failed:`, err.message);
      }
    }
  } catch (error) {
    console.error("Gemini API Error:", error.message);
  }
  return {
    verdict: "Partially Correct",
    verdictType: "warning",
    whatYouGotRight: "Submission received.",
    whatNeedsAttention: "Evaluation pending connectivity.",
    focusFirst: "Core concepts",
    whyYoureGettingStuck: "API limitation.",
    personalizedExplanation: "System fallback active.",
    optionalNextStep: "Try again later."
  };
};

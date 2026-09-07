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
// Public functions
// ---------------------------------------------------------------------------

/**
 * Generates assessment questions via Gemini with guaranteed JSON output.
 * Uses responseMimeType + responseSchema to prevent parsing crashes.
 *
 * @param {string} field       - The field (e.g., Backend Development)
 * @param {string} topic       - The topic (e.g., Node.js)
 * @param {string} difficulty  - Difficulty level (Easy, Medium, Hard)
 * @param {number} count       - Number of questions
 * @returns {Promise<Object>}  - Structured JSON { questions: [...] }
 */
export const generateQuestions = async (field, topic, difficulty, count) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QUESTIONS_SCHEMA,
      },
    });

    const prompt = `You are an expert technical assessor. Generate exactly ${count} multiple-choice questions for an assessment.

Field: ${field}
Topic: ${topic}
Difficulty: ${difficulty}

Requirements:
- Provide exactly 4 options per question.
- Only one option can be correct.
- Ensure questions are technically accurate and appropriate for the ${difficulty} difficulty level.
- Provide a short, useful explanation for the correct answer.
- Do NOT include duplicate questions.
- The "correctAnswer" must be the exact string of one of the 4 options.
- The "difficulty" field must be "${difficulty}" for every question.
- The "topic" field must be "${topic}" for every question.`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const response = await result.response;
    // With responseMimeType: "application/json", the output is guaranteed valid JSON
    const parsedJson = JSON.parse(response.text());
    return parsedJson;
  } catch (error) {
    console.error("Gemini API Error in generateQuestions:", error);
    throw new Error("Failed to generate AI questions: " + error.message);
  }
};

/**
 * Sends a completed assessment (questions + user answers) to Gemini for AI grading.
 * Returns per-question feedback and an overall assessment summary.
 *
 * @param {Object} params
 * @param {string} params.assessmentTitle    - Title of the assessment
 * @param {string} params.assessmentCategory - Category / topic area
 * @param {Array}  params.questions          - Array of question objects from the Assessment model
 * @param {Object} params.userAnswers        - Map of questionId -> userAnswer string
 * @returns {Promise<Object>} - { overallFeedback, overallRating, questionEvaluations[] }
 */
export const evaluateAssessmentWithAI = async ({
  assessmentTitle,
  assessmentCategory,
  questions,
  userAnswers,
}) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: EVALUATION_SCHEMA,
      },
    });

    // Build the question list for the prompt
    const questionLines = questions.map((q, idx) => {
      const qId = String(q._id || q.id || idx);
      const userAnswer = userAnswers[qId];
      const hasAnswer = userAnswer !== undefined && userAnswer !== null && String(userAnswer).trim() !== "";

      const lines = [
        `[Q${idx + 1}] ID: ${qId}`,
        `Type: ${q.type || "unknown"}`,
        `Question: ${q.question}`,
      ];

      // Include model answer for context if available (for long/short answer types)
      if (q.answer && String(q.answer).trim()) {
        lines.push(`Model Answer: ${q.answer}`);
      }

      // For MCQ include options and correct answer
      if (Array.isArray(q.options) && q.options.length > 0) {
        lines.push(`Options: ${q.options.join(" | ")}`);
        if (q.answer !== undefined && q.answer !== null) {
          lines.push(`Correct Answer: ${q.answer}`);
        }
      }

      lines.push(`Student Answer: ${hasAnswer ? userAnswer : "[No answer provided]"}`);
      return lines.join("\n");
    });

    const prompt = `You are an expert assessment evaluator and educator. Evaluate the following student assessment and provide detailed, constructive feedback.

Assessment: ${assessmentTitle}
Category: ${assessmentCategory}
Total Questions: ${questions.length}

--- QUESTIONS AND STUDENT ANSWERS ---

${questionLines.join("\n\n")}

--- EVALUATION INSTRUCTIONS ---

For each question:
1. Assign an aiScore from 0 to 10 based on answer quality, accuracy, and completeness.
2. Write a brief, constructive aiFeedback explaining what was done well and what was lacking.
3. List keyPointsMissed — specific concepts or points missing from the student's answer (empty array if answer is complete).
4. Assign status: "correct" (score >= 8), "partial" (score >= 4), or "incorrect" (score < 4).
5. For MCQ questions where the student selected the correct option, award full marks (10/10).
6. For unanswered questions, award 0 and note it in feedback.

Overall:
- Write a comprehensive overallFeedback paragraph (3-5 sentences) summarising performance, strengths, and areas to improve.
- Assign an overallRating based on average score: Excellent (>=85%), Good (>=70%), Average (>=55%), Needs Improvement (>=40%), Poor (<40%).
- Provide 2-4 concise, bulleted key strengths under strengths.
- Provide 1-3 targeted concepts or skills under areasToImprove.
- The questionEvaluations array must have exactly one entry per question, in the same order, using the exact questionId from each question.`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const parsedJson = JSON.parse(response.text());
    return parsedJson;
  } catch (error) {
    console.error("Gemini API Error in evaluateAssessmentWithAI:", error);
    throw new Error("Failed to evaluate assessment with AI: " + error.message);
  }
};

/**
 * Sends a multi-turn chat request to Gemini for the Personal Intelligence feature.
 * @param {string} systemPrompt - The system-level context/instructions
 * @param {Array}  messages     - Conversation history [{role, content}]
 * @returns {Promise<string>}   - The AI response text
 */
export const chatCompletion = async (systemPrompt, messages) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-3.6-flash",
      systemInstruction: systemPrompt,
    });

    // Gemini requires:
    // 1. History must start with a "user" role message
    // 2. Roles must alternate user/model
    // 3. Last message is sent separately via sendMessage()
    //
    // The frontend passes the full conversation including the initial assistant
    // greeting. We skip leading assistant messages and only keep valid pairs.

    const allButLast = messages.slice(0, -1);

    // Drop any leading assistant/model messages (e.g. the greeting)
    let start = 0;
    while (start < allButLast.length && allButLast[start].role !== "user") {
      start++;
    }

    const history = allButLast.slice(start).map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history });

    // The last message must always be from the user
    const lastMessage = messages[messages.length - 1];
    const result = await callWithRetry(() => chat.sendMessage(lastMessage.content));
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Gemini Chat API Error:", error.message);
    throw new Error("Failed to get response from Personal Intelligence: " + error.message);
  }
};

/**
 * Analyzes student submission (text explanation or code) for ConceptRoot diagnostic.
 * Produces structured 8-field JSON using Gemini with guaranteed schema.
 *
 * @param {Object} submission - { mode: "normal"|"code", question?: string, text?: string, code?: string }
 * @returns {Promise<Object>} - 8-field structured diagnosis
 */
export const analyzeConceptRootWithAI = async (submission) => {
  try {
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: "gemini-3.6-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: CONCEPT_ROOT_SCHEMA,
        temperature: 0.2,
      },
    });

    const prompt = `You are ConceptRoot AI, the diagnostic intelligence engine of AIFinity.
Your job is to analyze a student's answer or code submission and produce structured diagnostic feedback.

CRITICAL INSTRUCTION:
Do NOT simply mark an answer as wrong. Identify what the student understands, what is weak/incorrect, why it breaks, what they should focus on first, and provide a personalized explanation based specifically on their actual response.

Input Mode: ${submission.mode || "normal"}
Question/Context: ${submission.question || "Code Review Analysis"}
Student Submission:
${submission.text || submission.userAnswer || submission.code || "No response provided"}

Return JSON matching the schema with these 8 fields:
- verdict: "Incorrect" | "Partially Correct" | "Correct" | "Correct with Weakness" | "Ambiguous"
- verdictType: "error" (for Incorrect) | "warning" (for Partially Correct) | "success" (for Correct) | "indigo" (for Correct with Weakness) | "info" (for Ambiguous)
- whatYouGotRight: string explaining what the student understood correctly, or empty string "" if completely wrong/ambiguous
- whatNeedsAttention: string describing the exact conceptual gap, fragile reasoning, or code anti-pattern, or empty string "" if completely correct
- focusFirst: string naming the single minimum prerequisite or concept to review first
- whyYoureGettingStuck: string explaining the core mechanism behind the mistake in clear language
- personalizedExplanation: string giving a targeted explanation referencing the student's actual response
- optionalNextStep: string giving a concrete actionable step (e.g. review prerequisite, rewrite code)`;

    const result = await callWithRetry(() => model.generateContent(prompt));
    const response = await result.response;
    const parsedJson = JSON.parse(response.text());

    // Normalize empty strings to null for UI rendering
    if (!parsedJson.whatYouGotRight || parsedJson.whatYouGotRight.trim() === "") {
      parsedJson.whatYouGotRight = null;
    }
    if (!parsedJson.whatNeedsAttention || parsedJson.whatNeedsAttention.trim() === "") {
      parsedJson.whatNeedsAttention = null;
    }

    return parsedJson;
  } catch (error) {
    console.error("Gemini API Error in analyzeConceptRootWithAI:", error);
    throw new Error("Failed to analyze ConceptRoot submission with AI: " + error.message);
  }
};


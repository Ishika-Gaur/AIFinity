import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

let genAI = null;

const getGenAI = () => {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY is not set in environment variables. AI features will be unavailable.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

// Use environment variable, fallback to gemini-1.5-flash
const getModelName = () => {
  return process.env.GEMINI_MODEL || "gemini-3.6-flash";
};

/**
 * Robust JSON parser that handles markdown fences and partial invalid JSON
 */
const safeParseJSON = (text) => {
  try {
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.substring(7);
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.substring(3);
      if (cleanText.endsWith('```')) {
        cleanText = cleanText.substring(0, cleanText.length - 3);
      }
    }
    return JSON.parse(cleanText.trim());
  } catch (error) {
    throw new Error("Failed to parse AI JSON response: " + error.message);
  }
};

/**
 * Centralized AI Service function
 */
const callAI = async (prompt, schema, isChat = false, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const modelName = getModelName();
  const ai = getGenAI();
  
  let generationConfig = { responseMimeType: "application/json" };
  if (schema) {
    generationConfig.responseSchema = schema;
  } else {
    // If no schema, we probably don't force JSON (e.g. standard chat)
    generationConfig = {}; 
  }

  try {
    const model = ai.getGenerativeModel({ model: modelName, generationConfig });
    
    if (isChat) {
      const chat = model.startChat({ history });
      const result = await chat.sendMessage(prompt);
      return result.response.text();
    } else {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return schema ? safeParseJSON(text) : text;
    }
  } catch (err) {
    console.error(`[callAI] AI Service Error with model ${modelName}:`, err.message);
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
};

// ---------------------------------------------------------------------------
// Schema definitions
// ---------------------------------------------------------------------------

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

const CONCEPT_ROOT_SCHEMA_V2 = {
  type: SchemaType.OBJECT,
  properties: {
    status: {
      type: SchemaType.STRING,
      description: "Must be 'diagnosed' if a clear root cause from candidates is found, or 'insufficient_evidence' if cannot determine."
    },
    errorType: {
      type: SchemaType.STRING,
      description: "One of: incorrect_fact, misapplied_rule, boundary_error, invariant_violation, state_representation_error, pattern_recognition_failure, terminology_confusion, calculation_error, incomplete_reasoning, concept_misunderstanding, unanswered, unknown."
    },
    rootConceptId: {
      type: SchemaType.STRING,
      description: "The ID of the primary missing prerequisite/root concept. Must be chosen from the provided candidateRoots."
    },
    alternativeConceptIds: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING },
      description: "Other candidate root IDs that might also be contributing."
    },
    explanation: {
      type: SchemaType.STRING,
      description: "Why this root concept explains the student's mistakes."
    },
    recommendedDiagnostic: {
      type: SchemaType.STRING,
      description: "What targeted question could confirm this diagnosis?"
    }
  },
  required: ["status", "explanation"]
};

// ---------------------------------------------------------------------------
// Public functions
// ---------------------------------------------------------------------------

export const generateQuestions = async (field, topic, difficulty, count) => {
  const prompt = `You are an expert technical assessor. Generate exactly ${count} multiple-choice questions for ${topic} (${field}) at ${difficulty} level.`;
  try {
    return await callAI(prompt, QUESTIONS_SCHEMA);
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};

export const evaluateAssessmentWithAI = async ({ assessmentTitle, assessmentCategory, questions, userAnswers }) => {
  const prompt = `Evaluate the following student assessment: ${assessmentTitle}. Category: ${assessmentCategory}. Total Questions: ${questions.length}`;
  try {
    return await callAI(prompt, EVALUATION_SCHEMA);
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};

export const chatCompletion = async (systemPrompt, messages) => {
  const lastMessage = messages[messages.length - 1].content;
  const history = messages.slice(0, -1).map(m => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] }));
  try {
    return await callAI(lastMessage, null, true, history);
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};

export const analyzeConceptRootWithAI = async (targetConcept, candidateRoots, structuredEvidence) => {
  const prompt = `You are a diagnostic engine. Your task is to identify the root cause of the student's mistakes in the target concept based ONLY on the provided evidence.

Target Concept: ${targetConcept}
Candidate Root Concepts (Prerequisites): ${JSON.stringify(candidateRoots)}

Structured Evidence:
${JSON.stringify(structuredEvidence, null, 2)}

Instructions:
1. If the evidence clearly points to a misunderstanding of one of the Candidate Root Concepts, set status to "diagnosed", select the rootConceptId from the candidates, and pick the best matching errorType.
2. If there is not enough evidence to distinguish between candidate roots, or if none of the candidates explain the mistakes, set status to "insufficient_evidence".
3. Do NOT hallucinate or invent new rootConceptIds. You must only pick from the provided candidateRoots.
4. Do NOT calculate a confidence score (the backend handles this).`;

  try {
    const result = await callAI(prompt, CONCEPT_ROOT_SCHEMA_V2);
    return result;
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};


const SKILL_GAP_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    insights: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          skillId: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING, description: "Why the student has this gap or strength, based on the provided evidence." },
          actionPlan: { type: SchemaType.STRING, description: "Concrete steps to improve or maintain this skill." },
          practiceFocus: { type: SchemaType.STRING, description: "Specific topics or question types to practice." }
        },
        required: ["skillId", "reason", "actionPlan", "practiceFocus"]
      }
    },
    criticalGaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING, description: "List of skillIds that represent the most critical blockers." }
    },
    overallInsight: { type: SchemaType.STRING, description: "A summary of the learner's overall readiness." }
  },
  required: ["insights", "criticalGaps", "overallInsight"]
};

export const analyzeSkillGapWithAI = async (careerGoal, deterministicMetrics, attemptSummaries, rootSummaries) => {
  const prompt = `Perform a qualitative Skill Gap Analysis for the career goal: ${careerGoal || 'None'}.
You are provided with pre-calculated, deterministic metrics for the learner's skills.
Your job is ONLY to explain these numbers, provide reasons based on evidence, and generate action plans.
Do NOT recalculate or invent scores.

Deterministic Metrics:
${JSON.stringify(deterministicMetrics, null, 2)}

Evidence Context (Attempts):
${attemptSummaries}

Root Causes Identified:
${rootSummaries}
`;

  try {
    return await callAI(prompt, SKILL_GAP_SCHEMA);
  } catch (err) {
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
};



const ROADMAP_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    roadmap: {
      type: SchemaType.OBJECT,
      properties: {
        title: { type: SchemaType.STRING },
        career_goal: { type: SchemaType.STRING },
        target_role: { type: SchemaType.STRING },
        estimated_duration: { type: SchemaType.STRING },
        confidence: { type: SchemaType.NUMBER },
        phases: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              phase_id: { type: SchemaType.STRING },
              title: { type: SchemaType.STRING },
              objective: { type: SchemaType.STRING },
              priority: { type: SchemaType.STRING },
              estimated_duration: { type: SchemaType.STRING },
              skills: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    skill_id: { type: SchemaType.STRING },
                    name: { type: SchemaType.STRING },
                    status: { type: SchemaType.STRING },
                    priority: { type: SchemaType.STRING },
                    why: { type: SchemaType.STRING },
                    prerequisites: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    learning_tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    practice_tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    project_tasks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    validation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    estimated_hours: { type: SchemaType.NUMBER },
                    dependencies: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                    completion_criteria: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
                  },
                  required: ["skill_id", "name", "status", "priority", "why", "estimated_hours"]
                }
              }
            },
            required: ["phase_id", "title", "objective", "priority", "estimated_duration", "skills"]
          }
        }
      },
      required: ["title", "career_goal", "target_role", "estimated_duration", "confidence", "phases"]
    },
    short_roadmap: {
      type: SchemaType.OBJECT,
      properties: {
        current_focus: { type: SchemaType.STRING },
        next_steps: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        this_week: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
        next_milestone: { type: SchemaType.STRING }
      },
      required: ["current_focus", "next_steps", "this_week", "next_milestone"]
    }
  },
  required: ["roadmap", "short_roadmap"]
};


export const generatePersonalizedRoadmapWithAI = async (fullContext) => {
  const prompt = `You are generating a personalized career execution roadmap.

You MUST use the supplied student evidence.
You MUST respect the supplied career requirements.
You MUST respect prerequisites and dependencies.
You MUST NOT invent unsupported skills.
You MUST NOT recommend advanced skills before required prerequisites.
You MUST consider available study time.
You MUST NOT generate generic advice.

Every major recommendation must have a reason.
Return ONLY the requested structured JSON.

STUDENT PROFILE
Career Goal: ${fullContext.careerGoal || 'Not specified'}
Current Level: ${fullContext.currentLevel || 'Not specified'}
Available Time: ${fullContext.availableTime || 'Not specified'}

CURRENT EVIDENCE:
Learning Progress: ${JSON.stringify(fullContext.learningProgress)}
Assessment History: ${JSON.stringify(fullContext.assessmentHistorySummary)}

MISTAKEMAP:
${JSON.stringify(fullContext.mistakeMap)}

CONCEPTROOT:
${JSON.stringify(fullContext.conceptRoot)}

SKILL GAP:
${JSON.stringify(fullContext.skillGap)}

CAREER REQUIREMENTS & DEPENDENCIES (Use these specifically):
${JSON.stringify(fullContext.orderedSkills, null, 2)}
`;

  try {
    return await callAI(prompt, ROADMAP_SCHEMA);
  } catch (err) {
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
};


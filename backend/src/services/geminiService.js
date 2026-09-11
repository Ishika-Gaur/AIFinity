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

const CONCEPT_ROOT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    success: { type: SchemaType.BOOLEAN },
    surfaceTopic: { type: SchemaType.STRING },
    primaryRootCause: {
      type: SchemaType.OBJECT,
      properties: {
        concept: { type: SchemaType.STRING },
        confidence: { type: SchemaType.NUMBER },
        explanation: { type: SchemaType.STRING }
      },
      required: ["concept", "confidence", "explanation"]
    },
    secondaryRootCauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER },
          explanation: { type: SchemaType.STRING }
        },
        required: ["concept", "confidence", "explanation"]
      }
    },
    evidence: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    mistakePatterns: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    conceptHealth: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    dependencyPath: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    recoveryPath: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    overallInsight: { type: SchemaType.STRING }
  },
  required: [
    "success",
    "surfaceTopic",
    "primaryRootCause",
    "secondaryRootCauses",
    "evidence",
    "mistakePatterns",
    "conceptHealth",
    "dependencyPath",
    "recoveryPath",
    "overallInsight"
  ]
};

const DASHBOARD_CONCEPT_ROOT_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    surfaceTopic: { type: SchemaType.STRING },
    primaryRootCause: {
      type: SchemaType.OBJECT,
      properties: {
        concept: { type: SchemaType.STRING },
        confidence: { type: SchemaType.NUMBER },
        explanation: { type: SchemaType.STRING }
      },
      required: ["concept", "confidence", "explanation"]
    },
    secondaryRootCauses: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING },
          confidence: { type: SchemaType.NUMBER }
        },
        required: ["concept", "confidence"]
      }
    },
    evidence: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    mistakePatterns: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          mistake: { type: SchemaType.STRING },
          conceptProblem: { type: SchemaType.STRING },
          fundamentalConcept: { type: SchemaType.STRING },
          rootCause: { type: SchemaType.STRING }
        },
        required: ["mistake", "conceptProblem", "fundamentalConcept", "rootCause"]
      }
    },
    conceptHealth: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING },
          score: { type: SchemaType.NUMBER },
          isRoot: { type: SchemaType.BOOLEAN }
        },
        required: ["concept", "score", "isRoot"]
      }
    },
    dependencyPath: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    recoveryPath: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          step: { type: SchemaType.STRING },
          explanation: { type: SchemaType.STRING }
        },
        required: ["step", "explanation"]
      }
    },
    overallInsight: { type: SchemaType.STRING }
  },
  required: [
    "surfaceTopic",
    "primaryRootCause",
    "secondaryRootCauses",
    "evidence",
    "mistakePatterns",
    "conceptHealth",
    "dependencyPath",
    "recoveryPath",
    "overallInsight"
  ]
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

export const analyzeConceptRootWithAI = async (submission) => {
  const prompt = `Perform a deep Root Cause Analysis on this student submission.
Do NOT just say they are weak in the surface topic. Identify the underlying prerequisite/root concept they are struggling with.

Submission Data:
Mode: ${submission.mode}
Question: ${submission.question || 'N/A'}
User Answer / Text: ${submission.text || 'N/A'}
Code: ${submission.code || 'N/A'}`;

  try {
    const result = await callAI(prompt, CONCEPT_ROOT_SCHEMA);
    return result;
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};

export const analyzeConceptRootDashboardWithAI = async (attempts, careerGoal) => {
  const attemptSummaries = attempts.slice(0, 10).map(a => 
    'Assessment: ' + a.assessmentTitle + ', Score: ' + a.scorePercent + '%, Correct: ' + a.correctCount + ', Incorrect: ' + a.incorrectCount + '. ' +
    'Questions: ' + (a.questionResults || []).map(q => q.status === 'incorrect' ? ('Q: ' + q.questionText + ' | Concept: ' + q.concept + ' | Answer: ' + q.userAnswer) : '').filter(Boolean).join('; ')
  ).join('\n');

  const prompt = 'Perform a deep Root Cause Analysis on these recent student assessment attempts. Career Goal: ' + (careerGoal || 'None') + '.\n' +
'Identify the true underlying prerequisite concept they are struggling with, going below the surface topic.\n' +
'Return structured JSON with dependencyPath from surface to root, evidence, mistake patterns, and a learning recovery path.\n\n' +
'Recent attempts context:\n' + attemptSummaries;

  try {
    return await callAI(prompt, DASHBOARD_CONCEPT_ROOT_SCHEMA);
  } catch (err) {
    throw { success: false, error: "AI_SERVICE_UNAVAILABLE", message: "AI analysis is temporarily unavailable." };
  }
};


const SKILL_GAP_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    careerGoal: { type: SchemaType.STRING },
    skills: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          skill: { type: SchemaType.STRING },
          currentScore: { type: SchemaType.NUMBER },
          requiredScore: { type: SchemaType.NUMBER },
          gap: { type: SchemaType.NUMBER },
          priority: { type: SchemaType.STRING },
          evidence: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          reason: { type: SchemaType.STRING },
          rootConceptIssues: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
        },
        required: ["skill", "currentScore", "requiredScore", "gap", "priority", "evidence", "reason", "rootConceptIssues"]
      }
    },
    criticalGaps: {
      type: SchemaType.ARRAY,
      items: { type: SchemaType.STRING }
    },
    overallInsight: { type: SchemaType.STRING }
  },
  required: ["careerGoal", "skills", "criticalGaps", "overallInsight"]
};


export const analyzeSkillGapWithAI = async (careerGoal, attempts, conceptRoots) => {
  const attemptSummaries = attempts.slice(0, 10).map(a => 
    'Assessment: ' + a.assessmentTitle + ', Score: ' + a.scorePercent + '%. ' +
    'Mistakes: ' + (a.questionResults || []).filter(q => q.status === 'incorrect').map(q => q.concept).join(', ')
  ).join('\n');
  
  const rootSummaries = conceptRoots.map(c => 
    'Concept Root Analysis: ' + (c.analysis?.primaryRootCause?.concept || '') + ' - ' + (c.analysis?.primaryRootCause?.explanation || '')
  ).join('\n');

  const prompt = `Perform a deep Skill Gap Analysis for the career goal: ${careerGoal || 'None'}.
Identify the required industry skills, compare them against real student evidence, and calculate true gaps.
Do NOT use random numbers or arbitrary score thresholds. Base the analysis directly on the evidence.

Evidence Context:
Attempts:
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


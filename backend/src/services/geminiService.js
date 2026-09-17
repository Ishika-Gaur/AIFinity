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

// Candidate models tried in priority order
const getCandidateModels = () => {
  const custom = process.env.GEMINI_MODEL;
  const defaults = ["gemini-3.5-flash", "gemini-3.6-flash", "gemini-flash-latest"];
  if (custom && !defaults.includes(custom)) {
    return [custom, ...defaults];
  }
  return defaults;
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
 * Centralized AI Service function with multi-model fallback
 */
const callAI = async (prompt, schema, isChat = false, history = []) => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing");
  }

  const ai = getGenAI();
  const candidateModels = getCandidateModels();
  
  let generationConfig = { responseMimeType: "application/json" };
  if (schema) {
    generationConfig.responseSchema = schema;
  } else {
    generationConfig = {}; 
  }

  let lastError = null;
  for (const modelName of candidateModels) {
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
      console.warn(`[callAI] Error with model ${modelName}:`, err.message);
      lastError = err;
      // Continue to next candidate model
    }
  }

  console.error(`[callAI] All AI candidate models failed. Last error:`, lastError?.message);
  throw new Error("AI_SERVICE_UNAVAILABLE");
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
          concept:       { type: SchemaType.STRING },
        },
        required: ["question", "options", "correctAnswer", "explanation", "difficulty", "topic", "concept"],
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

/**
 * Dynamic curriculum fallback questions tailored to field & topic.
 * Ensures students (school, college, competitive exam) are NEVER blocked.
 */
export const generateCurriculumQuestions = (field = "General Knowledge", topic = "Fundamentals", difficulty = "Medium", count = 5) => {
  const isSchool = /class\s*\d+|10th|12th|school|cbse|icse/i.test(field + " " + topic);
  const isSocialScience = /social\s*science|history|geography|civics|economics|polity/i.test(field + " " + topic);
  const isScience = /science|physics|chemistry|biology/i.test(field + " " + topic);
  const isMath = /math|algebra|geometry|calculus|arithmetic/i.test(field + " " + topic);

  let templateBank = [];

  if (isSocialScience) {
    templateBank = [
      {
        question: `In the study of ${topic}, which factor played the most decisive role in shaping key historical and socio-economic outcomes?`,
        options: [
          "Constitutional reforms and grassroots citizen participation",
          "Complete isolation from neighboring regions and global trade",
          "Abolition of all formal educational institutions",
          "Uniform economic conditions without any regional variations"
        ],
        correctAnswer: "Constitutional reforms and grassroots citizen participation",
        explanation: "Socio-economic progress and historical transformations in social science are primarily driven by legal-institutional reforms and active civic engagement.",
        difficulty,
        topic
      },
      {
        question: `When analyzing resource distribution and governance within ${topic}, what is considered the foundation of sustainable development?`,
        options: [
          "Equitable access to resources and conservation for future generations",
          "Immediate and unconstrained exploitation of non-renewable resources",
          "Centralization of all local administrative powers into a single body",
          "Discontinuing technological investments in agriculture and industry"
        ],
        correctAnswer: "Equitable access to resources and conservation for future generations",
        explanation: "Sustainable development requires balancing present consumption with conservation for future generations while ensuring equitable access.",
        difficulty,
        topic
      },
      {
        question: `Under democratic frameworks related to ${topic}, how does power sharing strengthen national integration?`,
        options: [
          "By accommodating linguistic, regional, and social diversities peacefully",
          "By enforcing uniform cultural practices across all communities",
          "By eliminating local elected governing councils",
          "By discouraging public debates on legislative policies"
        ],
        correctAnswer: "By accommodating linguistic, regional, and social diversities peacefully",
        explanation: "Power sharing reduces conflicts among diverse groups and ensures that all communities have a voice in democratic governance.",
        difficulty,
        topic
      },
      {
        question: `Which indicator is primarily used in ${topic} to measure the comprehensive development of a nation beyond per capita income alone?`,
        options: [
          "Human Development Index (HDI), including life expectancy and education",
          "Total currency reserves held exclusively in commercial banks",
          "The gross number of consumer luxury goods manufactured annually",
          "Strictly the geographic land area administered by the government"
        ],
        correctAnswer: "Human Development Index (HDI), including life expectancy and education",
        explanation: "HDI accounts for health, educational attainment, and standard of living, providing a holistic view of human welfare.",
        difficulty,
        topic
      },
      {
        question: `How do checks and balances among the legislature, executive, and judiciary support stability in ${topic}?`,
        options: [
          "They prevent any single organ of the state from exercising unlimited power",
          "They permanently suspend periodic constitutional elections",
          "They merge administrative and judicial roles into one office",
          "They prohibit citizens from filing public grievances"
        ],
        correctAnswer: "They prevent any single organ of the state from exercising unlimited power",
        explanation: "Horizontal division of power ensures that each branch oversees the other, safeguarding the constitution and civil liberties.",
        difficulty,
        topic
      }
    ];
  } else if (isScience) {
    templateBank = [
      {
        question: `What fundamental law or principle governs energy interactions in the context of ${topic}?`,
        options: [
          "Conservation of energy: energy can neither be created nor destroyed, only transformed",
          "Energy spontaneously increases without external energy input",
          "Total mass decreases to zero during chemical equilibrium",
          "Reactions occur without any exchange of thermal or kinetic energy"
        ],
        correctAnswer: "Conservation of energy: energy can neither be created nor destroyed, only transformed",
        explanation: "The Law of Conservation of Energy is a cornerstone of physical and natural sciences.",
        difficulty,
        topic
      },
      {
        question: `In practical experimental observations of ${topic}, how is reproducibility best maintained?`,
        options: [
          "By controlling variables and documenting standard test conditions",
          "By altering measurement units randomly between trial iterations",
          "By omitting control group comparisons from the experiment",
          "By recording only outcomes that conform to subjective expectations"
        ],
        correctAnswer: "By controlling variables and documenting standard test conditions",
        explanation: "Scientific rigor relies on controlled variables and standardized measurement protocols.",
        difficulty,
        topic
      },
      {
        question: `Which of the following best describes the microscopic or cellular mechanism central to ${topic}?`,
        options: [
          "Specific biochemical molecular pathways responding to external stimuli",
          "Spontaneous cessation of all molecular movement at room temperature",
          "Random conversion of elements into unrelated atomic structures",
          "Direct violation of electrostatic force equilibrium"
        ],
        correctAnswer: "Specific biochemical molecular pathways responding to external stimuli",
        explanation: "Biological and physical phenomena are organized around specific molecular receptors and pathways.",
        difficulty,
        topic
      },
      {
        question: `What is the primary role of a catalyst or enzyme during reactions in ${topic}?`,
        options: [
          "Lowers activation energy to accelerate reaction rate without being consumed",
          "Increases reaction enthalpy permanently by consuming solvent",
          "Reverses the equilibrium constant completely regardless of temperature",
          "Stops electron transfer across reactive chemical bonds"
        ],
        correctAnswer: "Lowers activation energy to accelerate reaction rate without being consumed",
        explanation: "Catalysts provide an alternative reaction pathway with lower activation energy.",
        difficulty,
        topic
      },
      {
        question: `When interpreting graphical experimental data in ${topic}, a linear slope typically indicates:`,
        options: [
          "A direct proportionality between the independent and dependent variables",
          "A completely erratic relationship without correlation",
          "An inverse quadratic decay function",
          "The complete absence of measurable experimental data"
        ],
        correctAnswer: "A direct proportionality between the independent and dependent variables",
        explanation: "A straight line on a Cartesian plot represents a linear relationship between the variables.",
        difficulty,
        topic
      }
    ];
  } else {
    // General / Career / Professional fallback questions
    templateBank = [
      {
        question: `What is considered the foundational best practice when approaching problem-solving in ${topic}?`,
        options: [
          "Decomposing complex requirements into verifiable, modular components",
          "Implementing hasty solutions without analyzing requirements",
          "Skipping unit validation and moving directly to production",
          "Avoiding standardized documentation and version tracking"
        ],
        correctAnswer: "Decomposing complex requirements into verifiable, modular components",
        explanation: "Modular decomposition ensures maintainability, clarity, and systematic error tracking.",
        difficulty,
        topic
      },
      {
        question: `In ${field}, why is continuous evaluation and performance benchmarking critical for "${topic}"?`,
        options: [
          "It identifies edge-case bottlenecks early and ensures consistent quality",
          "It eliminates the need for architectural planning",
          "It guarantees 100% automated decision-making with zero human oversight",
          "It restricts future enhancements and updates"
        ],
        correctAnswer: "It identifies edge-case bottlenecks early and ensures consistent quality",
        explanation: "Regular benchmarking reveals performance gaps and helps iterate before deployment.",
        difficulty,
        topic
      },
      {
        question: `Which strategy yields the most sustainable long-term success when mastering ${topic}?`,
        options: [
          "Applying fundamental principles to real-world hands-on scenarios",
          "Relying solely on memorization of answers without conceptual clarity",
          "Disregarding industry standards and best practices",
          "Treating every subtopic in complete isolation without connecting concepts"
        ],
        correctAnswer: "Applying fundamental principles to real-world hands-on scenarios",
        explanation: "Active application of core principles solidifies mental models and enables adaptive problem solving.",
        difficulty,
        topic
      },
      {
        question: `When diagnosing unexpected errors or misconfigurations in ${topic}, what is the recommended first step?`,
        options: [
          "Isolate the root cause by examining inputs, logs, and telemetry systematically",
          "Immediately rewrite the entire implementation from scratch",
          "Ignore error logs and assume transient external failure",
          "Disable all validation checks to bypass failure alerts"
        ],
        correctAnswer: "Isolate the root cause by examining inputs, logs, and telemetry systematically",
        explanation: "Structured diagnostic tracing through logs and inputs pinpoints the exact point of failure.",
        difficulty,
        topic
      },
      {
        question: `How does adhering to clear conventions and structured patterns benefit projects in ${field}?`,
        options: [
          "Improves collaboration, reduces cognitive overhead, and eases maintenance",
          "Increases project complexity unnecessarily",
          "Makes the codebase or workflow harder for peers to understand",
          "Prevents team members from contributing to the project"
        ],
        correctAnswer: "Improves collaboration, reduces cognitive overhead, and eases maintenance",
        explanation: "Standardized conventions ensure that systems remain accessible, maintainable, and scalable.",
        difficulty,
        topic
      }
    ];
  }

  return {
    questions: templateBank.slice(0, Math.min(count, templateBank.length)).map((q) => ({
      ...q,
      topic: q.topic || topic,
      concept: q.concept || topic,
    }))
  };
};

export const generateQuestions = async (field, topic, difficulty, count, audienceContext = "") => {
  const prompt = `You are an expert examiner and professional assessor specializing in ${field || "General Knowledge"}.
Generate exactly ${count} realistic, high-quality multiple-choice questions testing knowledge of the topic "${topic}".
Difficulty level: ${difficulty}.
Domain / Field: ${field}.
${audienceContext ? `Target Audience / Context: ${audienceContext}.` : ""}

Guidelines:
1. Formulate realistic scenario-based or conceptual questions tailored directly to ${field} and ${topic}.
2. If the target audience is a school student (e.g., 10th standard, kids), ensure the language, examples, and complexity are perfectly suited for their grade level. Avoid overly corporate or advanced industry jargon.
3. Provide exactly 4 clear options for each question.
4. Make sure the correctAnswer is an exact string match with one of the options.
5. Include a concise, illuminating explanation for why that answer is correct.
6. Set difficulty to "${difficulty}", topic to "${topic}", and identify the specific granular concept or skill being tested (e.g. "Frequency Map", "Binary Search", "Power Sharing", "Two Pointer") in "concept".`;

  try {
    const res = await callAI(prompt, QUESTIONS_SCHEMA);
    if (res && Array.isArray(res.questions) && res.questions.length > 0) {
      return res;
    }
    throw new Error("Empty AI response");
  } catch (err) {
    console.warn(`[geminiService] AI generation failed (${err.message}), using rich curriculum questions for ${field} - ${topic}`);
    return generateCurriculumQuestions(field, topic, difficulty, count);
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
  const prompt = `You are generating a highly personalized, actionable execution roadmap tailored to the user's specific goal (e.g. 10th Board Exams, Medical Entrance, Software Engineering).

You MUST use the supplied student evidence.
You MUST respect the supplied career/academic requirements.
You MUST respect prerequisites and dependencies.
You MUST NOT invent unsupported skills.
You MUST NOT recommend advanced skills before required prerequisites.
You MUST consider available study time.
You MUST NOT generate generic advice like "Revise [topic]" or "Solve 20+ questions" or "Build a project". 
Instead, generate highly specific, context-aware tasks based on their field (e.g., for board exams: "Solve CBSE 2019-2023 Previous Year Questions (PYQs) for [Topic]", "Read NCERT Chapter 4", etc. For tech: "Implement a REST API using Express", etc.).

Every major recommendation must have a clear reason and be directly aligned with the user's syllabus or goal.
Return ONLY the requested structured JSON.

STUDENT PROFILE
Career/Academic Goal: ${fullContext.careerGoal || 'Not specified'}
Current Level: ${fullContext.currentLevel || 'Not specified'}
Academic Level / Grade: ${fullContext.audienceLevel || 'Not specified'}
Available Time: ${fullContext.availableTime || 'Not specified'}

IMPORTANT CONTEXT FOR TASK GENERATION:
- If the goal is related to school exams (e.g., 10th Board, 12th Board, CBSE, ICSE, NEET, JEE), the learning tasks MUST include:
  * Specific NCERT chapters to read
  * Board PYQs (Previous Year Questions) for each topic with year references (e.g., "Solve CBSE 2018-2023 PYQs on [Topic]")
  * Short-answer and long-answer practice aligned with board patterns
  * Diagrams or derivations if applicable
- If the goal is professional/technical, tasks should reference real tools, frameworks, and project implementations.
- NEVER use placeholder text like "Revise [topic]". Always be specific.

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

const PROJECT_IDEAS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    projects: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          id: { type: SchemaType.STRING },
          title: { type: SchemaType.STRING },
          level: { type: SchemaType.STRING },
          difficulty: { type: SchemaType.STRING, enum: ["Beginner", "Intermediate", "Advanced", "Production Ready"] },
          estimatedHours: { type: SchemaType.NUMBER },
          tags: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          description: { type: SchemaType.STRING },
          features: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
          architecture: { type: SchemaType.STRING },
          whyForCareer: { type: SchemaType.STRING }
        },
        required: ["id", "title", "level", "difficulty", "estimatedHours", "tags", "description", "features", "architecture", "whyForCareer"]
      }
    }
  },
  required: ["projects"]
};

export const generateProjectIdeasWithAI = async (topic, field) => {
  const prompt = `You are a career development expert and technical architect.
Generate exactly 4 highly-detailed, realistic project ideas or practical application scenarios for the following topic and field.
Topic: ${topic || "General"}
Field: ${field || "General"}

Requirements:
- Project 1 must be Difficulty: "Beginner" (Foundational level)
- Project 2 must be Difficulty: "Intermediate" (Core Competency)
- Project 3 must be Difficulty: "Advanced" (Advanced Specialization)
- Project 4 must be Difficulty: "Production Ready" (Career Capstone)
- Provide a concrete "title" and a deep "description".
- List exactly 4 "features".
- Provide an "architecture" blueprint (e.g., code snippet, structural outline, or methodology framework depending on the field).
- Explain "whyForCareer" (why recruiters or professionals value this project).
- "tags" should be 3-4 key tools, methodologies, or concepts used.

Return the response strictly matching the requested JSON schema.`;

  try {
    return await callAI(prompt, PROJECT_IDEAS_SCHEMA);
  } catch (err) {
    throw new Error("AI_SERVICE_UNAVAILABLE");
  }
};

const MISTAKE_MAP_INSIGHTS_SCHEMA = {
  type: SchemaType.OBJECT,
  properties: {
    summaryHeadline: { type: SchemaType.STRING },
    focusMore: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
          suggestedAction: { type: SchemaType.STRING },
          urgency: { type: SchemaType.STRING, enum: ["HIGH", "MEDIUM", "LOW"] },
        },
        required: ["concept", "reason", "suggestedAction", "urgency"],
      },
    },
    lowerPriority: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          concept: { type: SchemaType.STRING },
          reason: { type: SchemaType.STRING },
        },
        required: ["concept", "reason"],
      },
    },
    why: { type: SchemaType.STRING },
    recommendedPractice: {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          topic: { type: SchemaType.STRING },
          concept: { type: SchemaType.STRING },
          problemType: { type: SchemaType.STRING },
          practiceStrategy: { type: SchemaType.STRING },
          expectedOutcome: { type: SchemaType.STRING },
        },
        required: ["topic", "concept", "problemType", "practiceStrategy", "expectedOutcome"],
      },
    },
  },
  required: ["summaryHeadline", "focusMore", "lowerPriority", "why", "recommendedPractice"],
};

export const generateMistakeMapInsightsWithAI = async (mistakeMapStats, userProfile = {}) => {
  if (!mistakeMapStats || !mistakeMapStats.hasData || mistakeMapStats.totalAttempts === 0) {
    return {
      summaryHeadline: "Complete your first assessment to unlock personalized mistake pattern analysis.",
      focusMore: [],
      lowerPriority: [],
      why: "No assessment attempts recorded yet. AI recommendations are dynamically generated once actual performance telemetry is available.",
      recommendedPractice: [],
      isInsufficientData: true,
    };
  }

  const {
    summary = {},
    highPriorityConcepts = [],
    needsPracticeConcepts = [],
    strongConcepts = [],
    mistakeDistribution = {},
  } = mistakeMapStats;

  const weakSummaries = [...highPriorityConcepts, ...needsPracticeConcepts].slice(0, 6).map((c) =>
    `- Concept: ${c.concept} (Topic: ${c.topic}) | Accuracy: ${c.accuracy}% (${c.correctCount}/${c.totalAttempts} correct) | Mistakes: ${c.mistakeCount} | Primary Mistake Type: ${c.primaryMistakeType} | Recurring: ${c.isRecurringWeakness ? "YES" : "NO"} | Evidence: ${c.evidence}`
  ).join("\n");

  const strongSummaries = strongConcepts.slice(0, 4).map((c) =>
    `- Concept: ${c.concept} (Topic: ${c.topic}) | Accuracy: ${c.accuracy}% (${c.correctCount}/${c.totalAttempts} correct) | Mistakes: ${c.mistakeCount}`
  ).join("\n");

  const distributionSummary = (mistakeDistribution.breakdown || [])
    .filter((b) => b.count > 0)
    .map((b) => `${b.label}: ${b.count} (${b.percentage}%)`)
    .join(", ");

  const prompt = `You are an expert diagnostic learning analytics engine.
Analyze the following student's real Mistake Map statistical telemetry and produce actionable, grounded learning recommendations.

CRITICAL INSTRUCTIONS:
- You MUST base all insights strictly on the provided real performance data.
- Do NOT invent performance statistics, numbers, or topics not present in the evidence.
- "focusMore": List the high-priority concepts where error rates are high or recurring.
- "lowerPriority": List the strong concepts where high accuracy is demonstrated.
- "why": Provide a coherent explanation synthesizing the evidence behind why specific concepts are flagged as weaknesses.
- "recommendedPractice": Suggest specific problem types and targeted practice strategies for the weak areas.
- Target Field/Goal: ${userProfile?.careerGoal || userProfile?.selectedField || "General"}

STUDENT PERFORMANCE DATA:
Total Assessments: ${summary.totalAttempts || 0}
Total Questions: ${summary.totalQuestions || 0}
Overall Accuracy: ${summary.overallAccuracy || 0}%
Total Mistakes: ${summary.totalMistakes || 0}
Dominant Mistake Pattern: ${mistakeDistribution.dominantType || "NONE"} (${distributionSummary || "None"})

CONCEPTS NEEDING ATTENTION / PRACTICE:
${weakSummaries || "None flagged as weak."}

DEMONSTRATED STRONG CONCEPTS:
${strongSummaries || "No strong concepts recorded yet."}

Return the response strictly matching the requested JSON schema.`;

  try {
    const result = await callAI(prompt, MISTAKE_MAP_INSIGHTS_SCHEMA);
    return {
      ...result,
      isInsufficientData: false,
    };
  } catch (err) {
    console.warn("[MistakeMap AI] Gemini insight generation failed, returning statistical fallback:", err.message);
    return {
      summaryHeadline: highPriorityConcepts.length > 0
        ? `Focus on ${highPriorityConcepts.slice(0, 2).map((c) => c.concept).join(" and ")} to improve your overall accuracy.`
        : "Consistent practice across baseline topics will help stabilize performance.",
      focusMore: highPriorityConcepts.slice(0, 3).map((c) => ({
        concept: c.concept,
        reason: c.evidence,
        suggestedAction: `Practice targeted ${c.concept} questions with focus on ${c.primaryMistakeType.toLowerCase().replace(/_/g, " ")} accuracy.`,
        urgency: "HIGH",
      })),
      lowerPriority: strongConcepts.slice(0, 3).map((c) => ({
        concept: c.concept,
        reason: `Solid proficiency demonstrated with ${c.accuracy}% accuracy across ${c.totalAttempts} attempts.`,
      })),
      why: highPriorityConcepts.length > 0
        ? `Analysis of ${summary.totalAttempts} assessments shows recurring error patterns in ${highPriorityConcepts.map((c) => c.concept).join(", ")}. Addressing these will provide the highest score impact.`
        : `Overall accuracy is currently ${summary.overallAccuracy}% across ${summary.totalQuestions} questions.`,
      recommendedPractice: highPriorityConcepts.slice(0, 3).map((c) => ({
        topic: c.topic,
        concept: c.concept,
        problemType: `${c.concept} Diagnostic Practice`,
        practiceStrategy: `Focus on step-by-step resolution of ${c.primaryMistakeType.toLowerCase().replace(/_/g, " ")} steps.`,
        expectedOutcome: `Increase ${c.concept} accuracy to >= 75%.`,
      })),
      isInsufficientData: false,
      isFallback: true,
    };
  }
};


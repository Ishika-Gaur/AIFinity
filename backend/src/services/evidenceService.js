import { getCareerRequirements } from "./careerRequirementService.js";

const DIFFICULTY_WEIGHT = {
    easy: 0.7,
    medium: 1,
    hard: 1.5,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function normalizeDifficulty(input) {
    const value = String(input || "Medium").trim().toLowerCase();
    if (value.startsWith("easy")) return "Easy";
    if (value.startsWith("hard")) return "Hard";
    return "Medium";
}

function toIdentifier(value, fallback = "general") {
    const text = String(value || fallback).trim();
    if (!text) return fallback;
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || fallback;
}

function getSkillRequirement(skillName, careerGoal) {
    const goal = String(careerGoal || "").trim();
    const skills = getCareerRequirements(goal).skills || [];
    const byName = skills.find((skill) => {
        const targetName = String(skill.name || "").toLowerCase();
        const name = String(skillName || "").toLowerCase();
        return name === targetName || targetName.includes(name) || name.includes(targetName);
    });

    if (byName) {
        return {
            requiredProficiency: Number(byName.requiredProficiency ?? byName.required ?? 75) || 75,
            skillName: byName.name || skillName,
        };
    }

    return {
        requiredProficiency: 75,
        skillName,
    };
}

function normalizeEvidence(attempts = []) {
    const evidence = [];

    for (const attempt of attempts) {
        const questionResults = Array.isArray(attempt.questionResults) ? attempt.questionResults : [];
        const assessmentCategory = attempt.assessmentCategory || "General";

        for (const [index, result] of questionResults.entries()) {
            const questionId = String(result.questionId || result._id || `${attempt._id || "attempt"}-${index}`);
            const skillName = String(result.topic || result.skill || result.concept || attempt.assessmentCategory || "General").trim() || "General";
            const conceptName = String(result.concept || result.topic || attempt.assessmentCategory || "General").trim() || "General";
            const correctAnswer = result.correctAnswer ?? result.answer ?? "";
            const userAnswer = result.userAnswer ?? "";
            const isCorrect = result.isCorrect ?? (result.status === "correct" || (typeof result.marksAwarded === "number" && result.marksAwarded >= 7));

            evidence.push({
                questionId,
                attemptId: String(attempt._id || ""),
                studentId: attempt.userId ? String(attempt.userId) : "",
                conceptId: toIdentifier(conceptName),
                conceptName,
                skillId: toIdentifier(skillName),
                skillName,
                question: result.questionText || result.question || "Question",
                studentAnswer: userAnswer === null ? "" : String(userAnswer),
                correctAnswer: String(correctAnswer ?? ""),
                isCorrect: Boolean(isCorrect),
                difficulty: normalizeDifficulty(result.difficulty || attempt.difficulty || "Medium"),
                timestamp: attempt.completedAt || attempt.createdAt || new Date().toISOString(),
                assessmentTitle: attempt.assessmentTitle || "Assessment",
                assessmentCategory,
                marksAwarded: Number(result.marksAwarded || 0),
                maxMarks: Number(result.maxMarks || 10),
            });
        }
    }

    return evidence;
}

function summarizeConcepts(skillEvidence) {
    const concepts = new Map();

    for (const item of skillEvidence) {
        const key = item.conceptId;
        if (!concepts.has(key)) {
            concepts.set(key, {
                conceptId: key,
                conceptName: item.conceptName,
                evidenceCount: 0,
                correctCount: 0,
                incorrectCount: 0,
                skillNames: new Set(),
                sampleQuestions: [],
            });
        }

        const concept = concepts.get(key);
        concept.evidenceCount += 1;
        concept.skillNames.add(item.skillName);
        if (item.isCorrect) concept.correctCount += 1;
        else concept.incorrectCount += 1;

        if (concept.sampleQuestions.length < 4) {
            concept.sampleQuestions.push({
                questionId: item.questionId,
                question: item.question,
                isCorrect: item.isCorrect,
                difficulty: item.difficulty,
            });
        }
    }

    return Array.from(concepts.values()).map((concept) => {
        const total = concept.evidenceCount || 1;
        const accuracy = Math.round((concept.correctCount / total) * 100);
        return {
            conceptId: concept.conceptId,
            conceptName: concept.conceptName,
            evidenceCount: concept.evidenceCount,
            correctCount: concept.correctCount,
            incorrectCount: concept.incorrectCount,
            accuracy,
            skillNames: Array.from(concept.skillNames),
            sampleQuestions: concept.sampleQuestions,
        };
    }).sort((a, b) => b.incorrectCount - a.incorrectCount || b.evidenceCount - a.evidenceCount);
}

export function buildSkillGapAnalysis({ attempts = [], careerGoal = "", user = null }) {
    const evidence = normalizeEvidence(attempts);

    if (!evidence.length) {
        return {
            hasData: false,
            targetCareer: careerGoal,
            overallProficiency: 0,
            averageGap: 100,
            skills: [],
            strongAreas: [],
            weakAreas: [],
            recommendations: ["Complete at least one assessment to generate a skill profile."],
            summary: {
                totalEvidence: 0,
                correctCount: 0,
                incorrectCount: 0,
                skillCount: 0,
            },
            user: user ? {
                id: String(user._id || user.id || ""),
                name: user.name || "Student",
                careerGoal,
            } : {
                id: "",
                name: "Student",
                careerGoal,
            },
        };
    }

    const skillMap = new Map();

    for (const item of evidence) {
        if (!skillMap.has(item.skillId)) {
            skillMap.set(item.skillId, {
                skillId: item.skillId,
                skillName: item.skillName,
                evidence: [],
                concepts: new Map(),
            });
        }

        const skill = skillMap.get(item.skillId);
        skill.evidence.push(item);

        if (!skill.concepts.has(item.conceptId)) {
            skill.concepts.set(item.conceptId, {
                conceptId: item.conceptId,
                conceptName: item.conceptName,
                evidenceCount: 0,
                correctCount: 0,
                incorrectCount: 0,
            });
        }

        const concept = skill.concepts.get(item.conceptId);
        concept.evidenceCount += 1;
        if (item.isCorrect) concept.correctCount += 1;
        else concept.incorrectCount += 1;
    }

    const skills = Array.from(skillMap.values()).map((skill) => {
        const totalWeight = skill.evidence.reduce((sum, item) => sum + (DIFFICULTY_WEIGHT[String(item.difficulty).toLowerCase()] || 1), 0);
        const correctWeight = skill.evidence.reduce((sum, item) => sum + ((item.isCorrect ? 1 : 0) * (DIFFICULTY_WEIGHT[String(item.difficulty).toLowerCase()] || 1)), 0);
        const proficiency = totalWeight > 0 ? Math.round((correctWeight / totalWeight) * 100) : 0;
        const incorrectCount = skill.evidence.filter((item) => !item.isCorrect).length;
        const correctCount = skill.evidence.filter((item) => item.isCorrect).length;
        const conceptBreakdown = Array.from(skill.concepts.values())
            .map((concept) => ({
                ...concept,
                accuracy: Math.round((concept.correctCount / Math.max(concept.evidenceCount, 1)) * 100),
            }))
            .sort((a, b) => a.accuracy - b.accuracy);

        const requirement = getSkillRequirement(skill.skillName, careerGoal);
        const requiredProficiency = requirement.requiredProficiency;
        const gap = Math.max(requiredProficiency - proficiency, 0);
        const priority = gap >= 20 ? "high" : gap >= 10 ? "medium" : "low";
        const confidence = clamp(0.52 + ((skill.evidence.length / (skill.evidence.length + 6)) * 0.35) + ((correctCount / Math.max(skill.evidence.length, 1)) * 0.18), 0.42, 0.96);

        return {
            skillId: skill.skillId,
            skillName: skill.skillName,
            currentProficiency: proficiency,
            requiredProficiency,
            gap,
            priority,
            confidence: Number(confidence.toFixed(2)),
            evidenceCount: skill.evidence.length,
            correctCount,
            incorrectCount,
            concepts: conceptBreakdown.map((concept) => ({
                conceptId: concept.conceptId,
                conceptName: concept.conceptName,
                accuracy: concept.accuracy,
                evidenceCount: concept.evidenceCount,
            })),
            evidence: skill.evidence.slice(0, 8).map((item) => ({
                questionId: item.questionId,
                question: item.question,
                concept: item.conceptName,
                studentAnswer: item.studentAnswer,
                correctAnswer: item.correctAnswer,
                isCorrect: item.isCorrect,
                difficulty: item.difficulty,
                attemptId: item.attemptId,
                timestamp: item.timestamp,
            })),
            aiExplanation: `This skill is based on ${skill.evidence.length} real answers. ${correctCount} were correct and ${incorrectCount} were incorrect across recent attempts.`,
            recommendations: gap > 0
                ? [`Target ${requiredProficiency}% proficiency by practicing the weakest concepts under ${skill.skillName}.`]
                : [`Maintain current performance and challenge the student with higher-difficulty ${skill.skillName} tasks.`],
        };
    }).sort((a, b) => (b.gap || 0) - (a.gap || 0) || b.evidenceCount - a.evidenceCount);

    const overallProficiency = Math.round(
        evidence.reduce((sum, item) => sum + (item.isCorrect ? 100 : 0), 0) / Math.max(evidence.length, 1)
    );

    const strongAreas = skills.filter((skill) => skill.currentProficiency >= 75).sort((a, b) => b.currentProficiency - a.currentProficiency);
    const weakAreas = skills.filter((skill) => skill.currentProficiency < 75).sort((a, b) => a.currentProficiency - b.currentProficiency);
    const recommendations = [
        ...weakAreas.slice(0, 3).map((skill) => `Focus on ${skill.skillName} to close a ${skill.gap}-point gap.`),
        ...strongAreas.slice(0, 2).map((skill) => `Keep reinforcing ${skill.skillName} to maintain steady strength.`),
    ];

    return {
        hasData: true,
        targetCareer: careerGoal,
        overallProficiency,
        averageGap: Math.round(skills.reduce((sum, skill) => sum + skill.gap, 0) / Math.max(skills.length, 1)),
        skills,
        strongAreas: strongAreas.map((skill) => ({
            skillId: skill.skillId,
            skillName: skill.skillName,
            currentProficiency: skill.currentProficiency,
            gap: skill.gap,
        })),
        weakAreas: weakAreas.map((skill) => ({
            skillId: skill.skillId,
            skillName: skill.skillName,
            currentProficiency: skill.currentProficiency,
            gap: skill.gap,
        })),
        recommendations: recommendations.slice(0, 4),
        summary: {
            totalEvidence: evidence.length,
            correctCount: evidence.filter((item) => item.isCorrect).length,
            incorrectCount: evidence.filter((item) => !item.isCorrect).length,
            skillCount: skills.length,
        },
        user: user ? {
            id: String(user._id || user.id || ""),
            name: user.name || "Student",
            careerGoal,
        } : {
            id: "",
            name: "Student",
            careerGoal,
        },
    };
}

export function buildConceptRootAnalysis({ attempts = [], careerGoal = "", user = null }) {
    const evidence = normalizeEvidence(attempts).filter((item) => !item.isCorrect);

    if (!evidence.length) {
        return {
            hasData: false,
            user: user ? {
                id: String(user._id || user.id || ""),
                name: user.name || "Student",
                careerGoal,
            } : {
                id: "",
                name: "Student",
                careerGoal,
            },
            performance: {
                overallScore: 0,
                totalAssessments: attempts.length,
            },
            learningDiagnosis: {
                hasDiagnosis: false,
                concepts: [],
                mistakes: [],
                rootCauses: [],
                missingPrerequisites: [],
                recommendations: ["Complete more assessments so the system can identify recurring conceptual gaps."],
            },
        };
    }

    const conceptMap = new Map();

    for (const item of evidence) {
        if (!conceptMap.has(item.conceptId)) {
            conceptMap.set(item.conceptId, {
                conceptId: item.conceptId,
                conceptName: item.conceptName,
                evidenceCount: 0,
                incorrectCount: 0,
                relatedSkills: new Set(),
                relatedQuestions: [],
            });
        }

        const concept = conceptMap.get(item.conceptId);
        concept.evidenceCount += 1;
        concept.incorrectCount += 1;
        concept.relatedSkills.add(item.skillName);
        concept.relatedQuestions.push({
            questionId: item.questionId,
            question: item.question,
            skill: item.skillName,
            difficulty: item.difficulty,
            attemptId: item.attemptId,
            timestamp: item.timestamp,
            studentAnswer: item.studentAnswer,
            correctAnswer: item.correctAnswer,
        });
    }

    const concepts = Array.from(conceptMap.values())
        .map((concept) => {
            const totalAttempts = evidence.filter((item) => item.conceptId === concept.conceptId).length;
            const confidence = clamp(0.48 + (concept.incorrectCount / Math.max(totalAttempts, 1)) * 0.42, 0.48, 0.93);
            const explanation = `The student repeatedly missed questions tied to ${concept.conceptName}. This pattern suggests a recurring weak concept rather than isolated mistakes.`;

            return {
                conceptId: concept.conceptId,
                conceptName: concept.conceptName,
                evidenceCount: concept.evidenceCount,
                incorrectCount: concept.incorrectCount,
                relatedQuestions: concept.relatedQuestions.slice(0, 5),
                relatedSkills: Array.from(concept.relatedSkills),
                confidence: Number(confidence.toFixed(2)),
                explanation,
            };
        })
        .sort((a, b) => b.incorrectCount - a.incorrectCount);

    const recentErrors = evidence.slice(0, 8).map((item) => ({
        id: item.questionId,
        assessmentTitle: item.assessmentTitle,
        concept: item.conceptName,
        skill: item.skillName,
        question: item.question,
        studentAnswer: item.studentAnswer,
        correctAnswer: item.correctAnswer,
        difficulty: item.difficulty,
        result: "incorrect",
        attemptedAt: item.timestamp,
    }));

    const rootCauses = concepts.map((concept) => ({
        concept: concept.conceptName,
        evidenceCount: concept.evidenceCount,
        incorrectCount: concept.incorrectCount,
        confidence: concept.confidence,
        explanation: concept.explanation,
        relatedSkills: concept.relatedSkills,
    }));

    const performanceTotal = attempts.reduce((sum, attempt) => sum + (Number(attempt.scorePercent) || 0), 0);
    const avgScore = attempts.length ? Math.round(performanceTotal / attempts.length) : 0;

    return {
        hasData: true,
        user: user ? {
            id: String(user._id || user.id || ""),
            name: user.name || "Student",
            careerGoal,
        } : {
            id: "",
            name: "Student",
            careerGoal,
        },
        performance: {
            overallScore: avgScore,
            totalAssessments: attempts.length,
            strongConcepts: 0,
            improvingConcepts: 0,
            needsAttention: concepts.length,
        },
        learningDiagnosis: {
            hasDiagnosis: true,
            concepts: concepts.map((concept) => ({
                name: concept.conceptName,
                performance: Math.max(0, 100 - (concept.incorrectCount * 12)),
                status: concept.confidence >= 0.7 ? "attention" : "improving",
                attemptCount: concept.evidenceCount,
                evidenceCount: concept.evidenceCount,
                relatedSkills: concept.relatedSkills,
            })),
            mistakes: recentErrors,
            rootCauses,
            missingPrerequisites: concepts.slice(0, 3).map((concept) => ({
                concept: concept.conceptName,
                reason: `Repeated mistakes in ${concept.conceptName} show an underlying gap in the required prerequisite skill.`,
                priority: concept.confidence >= 0.75 ? "high" : "medium",
            })),
            recommendations: concepts.slice(0, 3).map((concept) => ({
                type: "concept_improvement",
                concept: concept.conceptName,
                action: `Practice ${concept.conceptName} with graded questions and revisit fundamentals before attempting advanced tasks.`,
                priority: concept.confidence >= 0.75 ? "high" : "medium",
            })),
        },
    };
}

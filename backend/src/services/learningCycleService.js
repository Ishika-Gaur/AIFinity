import mongoose from "mongoose";
import AttemptResult from "../models/AttemptResult.js";
import ConceptRootAnalysis from "../models/ConceptRootAnalysis.js";
import SkillGapAnalysis from "../models/SkillGapAnalysis.js";
import UserRoadmap from "../models/UserRoadmap.js";
import User from "../models/User.js";
import { analyzeConceptRootWithAI, analyzeSkillGapWithAI, generatePersonalizedRoadmapWithAI } from "./geminiService.js";

export const processLearningCycle = async (userId, attemptId) => {
  try {
     console.log(`[LearningCycle] Starting continuous learning loop for user ${userId} triggered by attempt ${attemptId}`);

     // 1. Fetch user & attempts
     const user = await User.findById(userId);
     const careerGoal = user.onboardingProfile?.careerGoal || user.selectedField || "Software Engineer";
     const attempts = await AttemptResult.find({ userId }).sort({ completedAt: -1 }).lean();
     if (attempts.length === 0) return;

     const latestAttempt = attempts.find(a => a._id.toString() === attemptId.toString()) || attempts[0];

     // 2. Trigger ConceptRoot
     try {
       console.log("[LearningCycle] Running ConceptRoot AI");
       const aiAnalysis = await analyzeConceptRootWithAI(latestAttempt);
       await ConceptRootAnalysis.findOneAndUpdate(
         { userId, latestAttemptId: attemptId },
         { analysis: aiAnalysis },
         { new: true, upsert: true }
       );
     } catch (err) {
       console.error("[LearningCycle] ConceptRoot update failed:", err.message);
     }

     // 3. Trigger SkillGap
     try {
       console.log("[LearningCycle] Running SkillGap AI");
       const conceptRoots = await ConceptRootAnalysis.find({ userId }).sort({ createdAt: -1 }).lean();
       const aiSkillGap = await analyzeSkillGapWithAI(careerGoal, attempts, conceptRoots.map(c => c.analysis));
       await SkillGapAnalysis.findOneAndUpdate(
         { userId, latestAttemptId: attemptId },
         { careerGoal, analysis: aiSkillGap },
         { new: true, upsert: true }
       );
     } catch (err) {
       console.error("[LearningCycle] SkillGap update failed:", err.message);
     }

     // 4. Trigger Roadmap
     try {
       console.log("[LearningCycle] Running Roadmap AI");
       const conceptRoots = await ConceptRootAnalysis.find({ userId }).sort({ createdAt: -1 }).limit(5).lean();
       const skillGap = await SkillGapAnalysis.findOne({ userId }).sort({ createdAt: -1 }).lean();

       const totalAttempts = attempts.length;
       const avgScore = totalAttempts > 0 ? Math.round(attempts.reduce((s, a) => s + a.scorePercent, 0) / totalAttempts) : 0;
  
       const mistakeMap = {};
       attempts.forEach(a => {
         (a.questionResults || []).forEach(q => {
           if (q.status === "incorrect" || !q.isCorrect) {
             mistakeMap[q.concept] = (mistakeMap[q.concept] || 0) + 1;
           }
         });
       });

       const studentContext = {
         careerGoal,
         currentLevel: `Average Score: ${avgScore}%`,
         skillGap: skillGap?.analysis || {},
         mistakeMap: {
           recurringMistakes: Object.entries(mistakeMap).sort((a,b)=>b[1]-a[1]).map(e => `${e[0]} (${e[1]} times)`).slice(0,10)
         },
         conceptRoot: conceptRoots.map(c => c.analysis),
         assessmentHistorySummary: attempts.slice(0, 10).map(a => `Assessed ${a.assessmentCategory}: ${a.scorePercent}%`),
         learningProgress: { completedAssessments: totalAttempts, avgScore }
       };

       const aiRoadmap = await generatePersonalizedRoadmapWithAI(studentContext);
       
       const newRoadmap = {
         userId,
         careerGoal,
         currentLevel: studentContext.currentLevel,
         roadmapTitle: aiRoadmap.roadmapTitle,
         summary: aiRoadmap.summary,
         estimatedDuration: aiRoadmap.estimatedDuration,
         phases: aiRoadmap.phases,
         evidenceSnapshot: { assessmentCount: attempts.length, lastAttemptId: attemptId }
       };

       await UserRoadmap.findOneAndUpdate(
         { userId },
         newRoadmap,
         { new: true, upsert: true }
       );

     } catch (err) {
       console.error("[LearningCycle] Roadmap update failed:", err.message);
     }

     console.log(`[LearningCycle] Completed loop successfully for user ${userId}`);
  } catch (globalErr) {
    console.error("[LearningCycle] Global failure in cycle orchestration:", globalErr);
  }
};

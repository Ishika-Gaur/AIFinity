import mongoose from "mongoose";
import ConceptRootAnalysis from "./src/models/ConceptRootAnalysis.js";

async function test() {
  await mongoose.connect("mongodb+srv://amanyt27082005_db_user:mlBv42m94lekLwwv@namastenode.ompokw3.mongodb.net/aifinity");
  
  try {
    const data = {
      userId: new mongoose.Types.ObjectId(),
      latestAttemptId: new mongoose.Types.ObjectId(),
      calculationVersion: "3B",
      deterministicRoot: {
        hasData: true,
        conceptId: "Test",
        canonicalConcept: "Test",
        skillId: "Test",
        mastery: {
          attempts: 4, correct: 3, accuracy: 0.75, recentAccuracy: 0.75, edgeCaseAccuracy: null, trend: "STABLE"
        },
        rootCause: {
          type: "UNKNOWN", confidence: 0, evidenceCount: 0
        },
        evidence: [],
        dependencies: [],
        diagnosis: { status: "INSUFFICIENT_EVIDENCE" }
      },
      aiInsights: null,
      aiStatus: "completed"
    };

    await ConceptRootAnalysis.create(data);
    console.log("Success");
  } catch(e) {
    console.error("Failed:", e.message);
  }
  process.exit();
}
test();

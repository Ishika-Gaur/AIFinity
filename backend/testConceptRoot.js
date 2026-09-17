import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import { getConceptRoot } from './src/controllers/conceptRootController.js';
import AttemptResult from './src/models/AttemptResult.js';
import ConceptRootAnalysis from './src/models/ConceptRootAnalysis.js';

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cognify_db');
  console.log("Connected to DB");
  
  const mockAttempts = [{
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    completedAt: new Date(),
    questionResults: [
      {
        questionId: "q1",
        questionText: "What is the time complexity of Binary Search?",
        userAnswer: "O(n)",
        correctAnswer: "O(log n)",
        canonicalConcept: "dsa.binary-search",
        canonicalSkill: "algo-analysis",
        isCorrect: false,
        difficulty: "Medium"
      },
      {
        questionId: "q2",
        questionText: "Which sorting algorithm is faster on average: Selection Sort or QuickSort?",
        userAnswer: "Selection Sort",
        correctAnswer: "QuickSort",
        canonicalConcept: "dsa.binary-search", 
        canonicalSkill: "algo-analysis",
        isCorrect: false,
        difficulty: "Hard"
      }
    ]
  }];
  
  AttemptResult.find = function() {
    return {
      sort: () => ({
        lean: async () => mockAttempts
      })
    };
  };

  ConceptRootAnalysis.findOne = function() {
    return {
      sort: () => ({
        lean: async () => null // force generating new analysis
      }),
      lean: async () => null
    };
  }
  
  ConceptRootAnalysis.prototype.save = async function() { return this; };

  const req = { user: { _id: mockAttempts[0].userId, name: "Test", email: "test@test.com" } };
  const res = {
    json: (data) => console.log(JSON.stringify(data, null, 2)),
    status: function(code) { console.log("Status:", code); return this; }
  };

  await getConceptRoot(req, res);
  
  await mongoose.disconnect();
}
run().catch(console.error);

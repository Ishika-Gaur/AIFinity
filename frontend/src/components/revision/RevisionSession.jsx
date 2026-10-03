import React, { useState, useEffect } from "react";
import Container from "../Container";
import DashboardHeader from "../dashboard/DashboardHeader";
import Card from "../Card";
import Button from "../Button";
import { startRevisionSession, completeRevision } from "../../services/revisionApiService";
import { ArrowLeft, CheckCircle, AlertTriangle, Lightbulb, PenTool } from "lucide-react";

export default function RevisionSession({ conceptId, onClose }) {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Steps: 0: Recall, 1: Learn, 2: Practice, 3: Confidence, 4: Done
  const [step, setStep] = useState(0); 
  
  // Recall state
  const [recallAnswer, setRecallAnswer] = useState("");
  
  // Practice state
  const [answers, setAnswers] = useState({});
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [practiceScore, setPracticeScore] = useState(0);
  
  useEffect(() => {
    loadSession();
  }, [conceptId]);

  const loadSession = async () => {
    try {
      const res = await startRevisionSession(conceptId);
      if (res.success) {
        setSessionData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to load revision session. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };

  const handleAnswerSelect = (qIndex, answer) => {
    if (practiceCompleted) return;
    setAnswers({ ...answers, [qIndex]: answer });
  };

  const submitPractice = () => {
    let correct = 0;
    sessionData.sessionContent.practiceQuestions.forEach((q, i) => {
      if (answers[i] === q.correctAnswer) correct++;
    });
    setPracticeScore(Math.round((correct / sessionData.sessionContent.practiceQuestions.length) * 100));
    setPracticeCompleted(true);
  };

  const submitConfidence = async (confidenceLevel) => {
    try {
      await completeRevision(conceptId, {
        practiceAccuracy: practiceScore,
        confidence: confidenceLevel
      });
      setStep(4); // Done
    } catch (err) {
      alert("Failed to save progress. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <DashboardHeader />
        <div className="flex-1 flex justify-center items-center">
          <div className="h-10 w-10 border-4 border-[#2E4F42] border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (error || !sessionData) {
    return (
      <div className="flex flex-col min-h-screen bg-gray-50">
        <DashboardHeader />
        <Container className="mt-8">
          <Card className="text-center py-12">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[#1B332C]">Session Error</h3>
            <p className="text-gray-500 mt-2 mb-6">{error || "Data missing"}</p>
            <Button onClick={onClose}>Back to Revision Center</Button>
          </Card>
        </Container>
      </div>
    );
  }

  const content = sessionData.sessionContent;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-16">
      <DashboardHeader />
      <Container className="mt-8 max-w-4xl">
        <button onClick={onClose} className="flex items-center text-gray-500 hover:text-gray-800 mb-6 font-medium">
          <ArrowLeft size={16} className="mr-2" /> Back to Dashboard
        </button>

        <div className="mb-6 flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-[#1B332C]">{sessionData.conceptName}</h1>
            <p className="text-gray-500 mt-1">Revision Session</p>
          </div>
          <div className="text-sm font-semibold text-gray-500">
            Step {Math.min(step + 1, 4)} of 4
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 h-2 rounded-full mb-8">
          <div 
            className="bg-[#4F46E5] h-2 rounded-full transition-all duration-500" 
            style={{ width: `${(step / 3) * 100}%` }}
          ></div>
        </div>

        {step === 0 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Lightbulb className="text-amber-500" /> Active Recall
            </h2>
            <p className="text-gray-600 mb-6">Before we review the material, what do you currently remember about <strong>{sessionData.conceptName}</strong>?</p>
            <textarea
              className="w-full border border-gray-300 rounded-lg p-4 mb-6 h-32 focus:outline-none focus:ring-2 focus:ring-[#4F46E5]"
              placeholder="Jot down your thoughts here..."
              value={recallAnswer}
              onChange={(e) => setRecallAnswer(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={handleNextStep}>Reveal Explanation</Button>
            </div>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <Card className="p-8">
              <h2 className="text-2xl font-bold mb-4">Core Explanation</h2>
              <p className="text-lg text-gray-700 leading-relaxed bg-indigo-50 p-6 rounded-lg border border-indigo-100">
                {content.explanation}
              </p>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold mb-4">Key Takeaways</h2>
              <ul className="space-y-3">
                {content.keyTakeaways.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <CheckCircle className="text-green-500 mt-1 shrink-0" size={18} />
                    <span className="text-gray-700">{point}</span>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-8">
              <h2 className="text-xl font-bold mb-4">Worked Example</h2>
              <div className="bg-gray-100 p-6 rounded-lg mb-6 border border-gray-200">
                <h4 className="font-bold text-gray-800 mb-2">Problem</h4>
                <p className="text-gray-700 mb-4">{content.workedExample.problem}</p>
                
                <h4 className="font-bold text-gray-800 mb-2">Solution</h4>
                <p className="text-gray-700">{content.workedExample.solution}</p>
              </div>

              <div className="bg-red-50 border border-red-100 p-5 rounded-lg flex gap-4 items-start">
                <AlertTriangle className="text-red-500 mt-1 shrink-0" />
                <div>
                  <h4 className="font-bold text-red-800 mb-1">Common Mistake</h4>
                  <p className="text-red-700 text-sm">{content.workedExample.commonMistake}</p>
                </div>
              </div>
            </Card>

            <div className="flex justify-end mt-8">
              <Button onClick={handleNextStep}>Continue to Practice</Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <Card className="p-8">
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <PenTool className="text-[#4F46E5]" /> Quick Practice
            </h2>
            <p className="text-gray-500 mb-8">Test your understanding to update your mastery score.</p>

            <div className="space-y-10">
              {content.practiceQuestions.map((q, i) => (
                <div key={i} className="border-b border-gray-100 pb-8 last:border-0">
                  <h4 className="text-lg font-medium text-gray-800 mb-4">{i + 1}. {q.question}</h4>
                  <div className="space-y-3">
                    {q.options.map((opt, optIdx) => {
                      const isSelected = answers[i] === opt;
                      const isCorrectAnswer = q.correctAnswer === opt;
                      
                      let btnClass = "w-full text-left p-4 rounded-lg border transition-colors ";
                      if (!practiceCompleted) {
                        btnClass += isSelected ? "border-[#4F46E5] bg-indigo-50" : "border-gray-200 hover:bg-gray-50";
                      } else {
                        if (isCorrectAnswer) btnClass += "border-green-500 bg-green-50";
                        else if (isSelected) btnClass += "border-red-500 bg-red-50";
                        else btnClass += "border-gray-200 opacity-50";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={practiceCompleted}
                          className={btnClass}
                          onClick={() => handleAnswerSelect(i, opt)}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                  {practiceCompleted && (
                    <div className={`mt-4 p-4 rounded-lg text-sm ${answers[i] === q.correctAnswer ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      <strong>Explanation: </strong> {q.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end mt-8">
              {!practiceCompleted ? (
                <Button 
                  onClick={submitPractice} 
                  disabled={Object.keys(answers).length < content.practiceQuestions.length}
                >
                  Submit Answers
                </Button>
              ) : (
                <Button onClick={handleNextStep}>Next</Button>
              )}
            </div>
          </Card>
        )}

        {step === 3 && (
          <Card className="p-8 text-center py-12">
            <h2 className="text-2xl font-bold mb-4">How confident are you now?</h2>
            <p className="text-gray-500 mb-8">This helps us schedule your next revision appropriately.</p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button onClick={() => submitConfidence(1)} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">Not Confident</button>
              <button onClick={() => submitConfidence(2)} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">Somewhat Confident</button>
              <button onClick={() => submitConfidence(3)} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition font-medium text-gray-700">Confident</button>
              <button onClick={() => submitConfidence(4)} className="p-4 border border-[#4F46E5] bg-indigo-50 rounded-lg hover:bg-indigo-100 transition font-medium text-[#4F46E5]">Very Confident</button>
            </div>
          </Card>
        )}

        {step === 4 && (
          <Card className="p-8 text-center py-12">
            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-[#1B332C] mb-4">Revision Complete!</h2>
            <p className="text-lg text-gray-600 mb-8">
              You scored <strong>{practiceScore}%</strong> on the practice. Your mastery has been updated and the next review is scheduled.
            </p>
            <Button onClick={onClose} size="lg">Return to Dashboard</Button>
          </Card>
        )}

      </Container>
    </div>
  );
}

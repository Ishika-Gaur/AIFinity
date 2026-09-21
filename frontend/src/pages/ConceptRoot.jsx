import React, { useState, useEffect } from "react";
import Section from "../components/Section";
import { conceptRootApi } from "../services/api";
import { useStudentAuth } from "../context/StudentAuthContext";
import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function ConceptRoot() {
  const { user } = useStudentAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!user) {
        setLoading(false);
        return;
      }
      const res = await conceptRootApi.get();
      if (res.success) {
        setData(res.data);
      } else {
        setError(true);
      }
      setLoading(false);
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <Section className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-3xl">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </Section>
    );
  }

  if (error) {
    return (
      <Section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Unable to load diagnosis</h3>
          <p className="text-gray-600 mb-6">There was a problem fetching your ConceptRoot data.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)]">
            Retry
          </button>
        </div>
      </Section>
    );
  }

  if (!user) {
    return (
      <Section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Sign in to view ConceptRoot</h3>
          <p className="text-gray-600 mb-6">Log in to view your diagnostic report.</p>
          <Link to="/login" className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)]">
            Sign In
          </Link>
        </div>
      </Section>
    );
  }

  if (!data || !data.hasData || !data.conceptId) {
    return (
      <Section className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No ConceptRoot Data Yet</h3>
          <p className="text-gray-600 mb-6">Take an assessment to generate your first diagnostic report.</p>
          <Link to="/assessment" className="inline-block px-6 py-3 bg-[var(--color-primary-600)] text-white rounded-lg font-medium hover:bg-[var(--color-primary-700)]">
            Start Assessment
          </Link>
        </div>
      </Section>
    );
  }

  const isInsufficient = data.diagnosis.status === "INSUFFICIENT_EVIDENCE";
  const confidenceScore = data.rootCause?.confidence || 0;
  
  // Format Confidence Label
  let confColor = "text-gray-600";
  if (data.diagnosis.status === "HIGH_CONFIDENCE") confColor = "text-green-600";
  else if (data.diagnosis.status === "MODERATE_CONFIDENCE") confColor = "text-yellow-600";
  else if (data.diagnosis.status === "TENTATIVE") confColor = "text-orange-600";

  return (
    <div className="bg-gray-50 min-h-screen pb-20">
      <Section className="pt-12">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">ConceptRoot Diagnosis</h1>
              <p className="text-gray-500 mt-1">AI-powered root cause analysis</p>
            </div>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isInsufficient ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-800'}`}>
                {isInsufficient ? 'Pending Data' : 'Diagnosis Active'}
              </span>
            </div>
          </div>

          {/* Handle Insufficient Evidence Gracefully */}
          {isInsufficient ? (
            <div className="bg-white rounded-2xl border border-[var(--color-border)] p-8 shadow-sm text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-gray-100 rounded-full mb-4">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Not enough evidence yet.</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                AIFINITY detected an incorrect attempt, but one attempt is not enough to determine a recurring root cause. Keep practicing this concept and return after more attempts are available.
              </p>
            </div>
          ) : (
            <>
              {/* Root Cause */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm border-t-4 border-t-[var(--color-primary-600)]">
                <span className="text-xs font-bold text-[var(--color-primary-700)] uppercase tracking-wider mb-3 block">Root Cause</span>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{data.rootCause.rootConceptName}</h3>
                <p className="text-gray-600 font-medium mb-1">
                  Detected Pattern: <span className="capitalize text-gray-900">{data.rootCause.type.replace(/_/g, ' ').toLowerCase()}</span>
                </p>
                {data.explanation?.conceptRelationship && (
                  <p className="text-gray-700 text-sm mt-3">
                    {data.explanation.conceptRelationship}
                  </p>
                )}
              </div>

              {/* Why You’re Making This Mistake */}
              {data.explanation && (data.explanation.whyMistakeHappens || data.explanation.misconception) && (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm border-l-4 border-l-red-500">
                  <span className="text-xs font-bold text-red-600 uppercase tracking-wider mb-4 block">Why You’re Making This Mistake</span>
                  {data.explanation.misconception && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-800">
                      <strong className="font-semibold text-red-900 block mb-1">Core Misconception:</strong>
                      {data.explanation.misconception}
                    </div>
                  )}
                  {data.explanation.whyMistakeHappens && (
                    <p className="text-gray-800 leading-relaxed text-sm">
                      {data.explanation.whyMistakeHappens}
                    </p>
                  )}
                </div>
              )}

              {/* Evidence Behind Diagnosis */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 block">Evidence Behind Diagnosis</span>
                
                <div className="flex flex-col md:flex-row items-center gap-6 divide-y md:divide-y-0 md:divide-x divide-gray-100 mb-6">
                  <div className="flex-1 w-full pt-4 md:pt-0">
                    <div className="flex gap-6">
                      <div>
                        <div className="text-2xl font-bold text-gray-900">{data.mastery.attempts}</div>
                        <div className="text-xs text-gray-500">Relevant Attempts</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-600">{data.mastery.attempts - data.mastery.correct}</div>
                        <div className="text-xs text-gray-500">Incorrect</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-500">{data.rootCause.evidenceCount}</div>
                        <div className="text-xs text-gray-500">Pattern Matches</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 w-full pt-4 md:pt-0 md:pl-6">
                    <div className="flex items-center gap-3">
                      <div className={`text-xl font-bold ${confColor}`}>
                        {data.diagnosis.status.replace('_CONFIDENCE', '').replace('_', ' ')} Confidence
                      </div>
                    </div>
                    {data.explanation?.confidenceNote && (
                      <p className="text-xs text-gray-500 mt-1">{data.explanation.confidenceNote}</p>
                    )}
                  </div>
                </div>

                {/* Evidence Logs */}
                {data.evidence && data.evidence.filter(e => !e.isCorrect).length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase">Recent Mistakes:</p>
                    {data.evidence.filter(e => !e.isCorrect).slice(0, 3).map((sq, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <span className="text-xs text-gray-400 uppercase block mb-1">Your Answer</span>
                          <span className="font-mono text-red-600">{sq.studentAnswer}</span>
                        </div>
                        <div className="flex-1">
                          <span className="text-xs text-gray-400 uppercase block mb-1">Correct Answer</span>
                          <span className="font-mono text-green-600">{sq.correctAnswer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Concept You Need to Strengthen */}
              <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm border-t-4 border-t-blue-500">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-3 block">Concept You Need to Strengthen</span>
                <h3 className="text-xl font-bold text-gray-900 mb-1">{data.canonicalConcept}</h3>
                <p className="text-sm font-medium text-blue-600 mb-3">{data.skillId}</p>
                {data.explanation?.explanation && (
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {data.explanation.explanation}
                  </p>
                )}
              </div>

              {/* Personalized Fix */}
              {data.explanation && (data.explanation.whatToUnderstand || data.explanation.mentalModel || data.explanation.howToAvoid) && (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm">
                  <span className="text-xs font-bold text-purple-600 uppercase tracking-wider mb-4 block">Personalized Fix</span>
                  
                  <div className="space-y-6">
                    {(data.explanation.whatToUnderstand?.length > 0 || data.explanation.recommendedRevision?.length > 0) && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2">What To Understand:</h4>
                        <ul className="space-y-2">
                          {(data.explanation.whatToUnderstand || data.explanation.recommendedRevision).map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-purple-500 mt-0.5">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {data.explanation.mentalModel && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2">Mental Model:</h4>
                        <p className="text-gray-700 text-sm italic bg-purple-50 p-3 rounded-lg border border-purple-100">
                          "{data.explanation.mentalModel}"
                        </p>
                      </div>
                    )}

                    {data.explanation.howToAvoid?.length > 0 && (
                      <div>
                        <h4 className="text-sm font-bold text-gray-800 mb-2">How to Avoid Next Time:</h4>
                        <ul className="space-y-2">
                          {data.explanation.howToAvoid.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                              <span className="text-purple-500 mt-0.5">□</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended Practice */}
              {data.explanation?.recommendedPractice?.length > 0 && (
                <div className="bg-white rounded-2xl border border-[var(--color-border)] p-6 shadow-sm border-l-4 border-l-green-500">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-wider mb-4 block">Recommended Practice</span>
                  <ul className="space-y-3">
                    {data.explanation.recommendedPractice.slice(0, 5).map((item, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-800 bg-green-50/50 p-3 rounded-lg">
                        <span className="text-green-500 mt-0.5 shrink-0">→</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </>
          )}

          {/* Next Step → Start Targeted Practice */}
          {data.hasData && (
            <div className="mt-8 bg-[var(--color-primary-900)] rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                <span className="text-xs font-bold text-[var(--color-primary-200)] uppercase tracking-wider mb-3 block">Next Step</span>
                <h3 className="text-2xl font-bold text-white mb-3">Start Targeted Practice</h3>
                <p className="text-[var(--color-primary-100)] text-sm max-w-xl mx-auto mb-6">
                  Your ConceptRoot diagnosis is complete. We've customized your learning path based on this exact root cause. 
                  Apply your personalized fix and start mastering {data.canonicalConcept} now.
                </p>
                <Link to="/roadmap" className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-gray-900 text-base font-bold shadow-md rounded-xl transition-transform hover:scale-105">
                  Go to Roadmap 
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </Link>
              </div>
            </div>
          )}

        </div>
      </Section>
    </div>
  );
}

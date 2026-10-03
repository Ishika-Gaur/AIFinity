import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Container from "../components/Container";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import Card from "../components/Card";
import Button from "../components/Button";
import RevisionSession from "../components/revision/RevisionSession";
import { getRevisionDashboard } from "../services/revisionApiService";
import { BookOpen, AlertCircle, CheckCircle, Clock } from "lucide-react";

export default function Revision() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [filter, setFilter] = useState("ALL"); // ALL, DUE, COMPLETED

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getRevisionDashboard();
      if (res.success) {
        setData(res.data);
      } else {
        setError(res.message);
      }
    } catch (err) {
      setError("Failed to load revision data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartRevision = (conceptId) => {
    setActiveSessionId(conceptId);
  };

  const handleCloseSession = () => {
    setActiveSessionId(null);
    loadDashboard(); // Refresh data to show updated nextReviewAt / status
  };

  if (activeSessionId) {
    return (
      <RevisionSession 
        conceptId={activeSessionId} 
        onClose={handleCloseSession} 
      />
    );
  }

  return (
    <div className="pb-16">
      <DashboardHeader />
      <Container className="mt-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1B332C]">Revision Center</h1>
          <p className="text-[var(--color-text-muted)] mt-2">
            Focus on what needs reinforcement based on your recent learning evidence.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-[#2E4F42] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <Card className="text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1B332C]">Unable to load data</h3>
            <p className="text-[var(--color-text-muted)] mt-2 mb-6">{error}</p>
            <Button onClick={loadDashboard}>Try Again</Button>
          </Card>
        ) : (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Due Today</span>
                <span className="text-3xl font-bold text-red-500 mt-2">{data?.summary?.dueToday || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">High Priority</span>
                <span className="text-3xl font-bold text-orange-500 mt-2">{data?.summary?.highPriority || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Completed</span>
                <span className="text-3xl font-bold text-green-500 mt-2">{data?.summary?.completed || 0}</span>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Tracked</span>
                <span className="text-3xl font-bold text-indigo-600 mt-2">{data?.summary?.total || 0}</span>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 mb-6 border-b border-gray-200 pb-4">
              <button
                className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${filter === "ALL" ? "bg-[var(--color-primary-50)] text-[#2E4F42]" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setFilter("ALL")}
              >
                All Concepts
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${filter === "DUE" ? "bg-[var(--color-primary-50)] text-[#2E4F42]" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setFilter("DUE")}
              >
                Due for Revision
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm rounded-md transition-colors ${filter === "COMPLETED" ? "bg-[var(--color-primary-50)] text-[#2E4F42]" : "text-gray-500 hover:text-gray-900"}`}
                onClick={() => setFilter("COMPLETED")}
              >
                Completed
              </button>
            </div>

            {/* Revision Items */}
            {data?.items?.length === 0 ? (
              <Card className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-[#1B332C]">No concepts currently need revision</h3>
                <p className="text-[var(--color-text-muted)] mt-3 max-w-md mx-auto">
                  Complete an assessment to generate personalized revision recommendations based on your learning evidence.
                </p>
                <div className="mt-8">
                  <Link to="/assessment">
                    <Button>Go to Assessments</Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.items
                  .filter(item => filter === "ALL" || item.status === filter)
                  .map((item) => (
                  <Card key={item.conceptId} className="flex flex-col h-full" hoverable={false}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-[#1B332C]">{item.conceptName}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          Mastery: <span className="font-medium">{item.masteryLevel} ({item.masteryScore}%)</span>
                        </p>
                      </div>
                      {item.priority === "HIGH" && (
                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded">HIGH</span>
                      )}
                      {item.priority === "MEDIUM" && (
                        <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded">MEDIUM</span>
                      )}
                      {item.priority === "LOW" && (
                        <span className="bg-gray-100 text-gray-700 text-xs font-bold px-2 py-1 rounded">LOW</span>
                      )}
                    </div>
                    
                    <div className="bg-gray-50 rounded p-4 mb-4 flex-1">
                      <p className="text-sm text-gray-600 font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle size={16} /> Why revise this?
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 list-disc pl-5">
                        <li>{item.incorrectAttempts} recent incorrect attempts</li>
                        <li>Current accuracy is {item.masteryScore}%</li>
                        {item.status === "DUE" && item.nextReviewAt && (
                          <li>Scheduled for spaced review</li>
                        )}
                      </ul>
                    </div>
                    
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500 flex items-center gap-1">
                        {item.status === "DUE" ? (
                          <><Clock size={14} className="text-amber-500" /> Due Now</>
                        ) : (
                          <><CheckCircle size={14} className="text-green-500" /> Reviewed</>
                        )}
                      </div>
                      <Button size="sm" onClick={() => handleStartRevision(item.conceptId)}>
                        Start Revision
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

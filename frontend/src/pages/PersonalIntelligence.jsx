import React, { useState, useEffect, useRef, useCallback } from "react";
import { personalIntelligenceService } from "../services/personalIntelligenceService";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

const DEFAULT_WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I am AIFinity Personal Intelligence. I've analyzed your learning journey, assessment scores, and roadmap. How can I help you today?",
  createdAt: new Date().toISOString(),
};

export default function PersonalIntelligence() {
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  // 1. Fetch user-specific chat history on mount from MongoDB
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const history = await personalIntelligenceService.getHistory();
      if (Array.isArray(history) && history.length > 0) {
        setMessages(history);
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch (err) {
      console.error("[PersonalIntelligence] Failed to load history:", err);
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handlePromptClick = (text) => {
    setInput(text);
    setTimeout(() => {
      sendMessage(text);
    }, 50);
  };

  const sendMessage = async (messageText) => {
    const text = messageText || input;
    if (!text.trim() || loading) return;

    const userMessage = {
      role: "user",
      content: text.trim(),
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send conversation history to backend, which persists both user & assistant messages
      const chatHistory = [...messages, userMessage];
      const aiResponse = await personalIntelligenceService.chat(chatHistory);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: aiResponse,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Unable to generate your insight right now. Please check your connection and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = async () => {
    if (!window.confirm("Are you sure you want to clear your conversation history? This cannot be undone.")) {
      return;
    }

    setClearing(true);
    try {
      await personalIntelligenceService.clearHistory();
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    } catch (err) {
      console.error("[PersonalIntelligence] Clear history failed:", err);
      alert("Failed to clear chat history. Please try again.");
    } finally {
      setClearing(false);
    }
  };

  const SUGGESTED_PROMPTS = [
    "What should I study today?",
    "Explain my weakest topic",
    "Analyze my mistakes",
    "How can I improve my score?",
    "Create a study plan for me",
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-70px)] bg-[#FBF8F0] lg:px-8 px-4 py-6 mx-auto max-w-4xl w-full">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1
            className="text-2xl font-bold text-[#1B332C]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Personal Intelligence
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Your personalized AI companion — conversation history is saved securely to your profile.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 1 && (
            <button
              onClick={handleClearHistory}
              disabled={clearing || loading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#C1443C]/25 bg-white px-3 py-1.5 text-xs font-semibold text-[#C1443C] hover:bg-[#C1443C]/10 transition-colors disabled:opacity-50 cursor-pointer"
              title="Clear chat history"
            >
              {clearing ? "Clearing…" : "Clear Chat"}
            </button>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
            Dashboard
          </Button>
        </div>
      </div>

      {/* Main Chat Box */}
      <div className="flex-1 bg-white border border-[#2E4F42]/20 rounded-2xl shadow-[var(--shadow-card)] flex flex-col overflow-hidden">
        {/* Chat Messages */}
        <div
          className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
          ref={scrollContainerRef}
        >
          {historyLoading ? (
            <div className="flex h-full items-center justify-center py-20">
              <div className="flex items-center gap-3 text-sm text-[#5B6B5F] font-semibold">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1B332C] border-t-transparent" />
                Loading your saved conversation history…
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${
                    msg.role === "user" ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1B332C] text-white rounded-br-sm shadow-md"
                        : "bg-[#F1EDE1] text-[#24413A] rounded-bl-sm shadow-xs border border-[#2E4F42]/10"
                    }`}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {msg.content}
                  </div>
                  {msg.createdAt && (
                    <span className="text-[10px] font-mono text-[#8B9690] mt-1 px-1">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-[#F1EDE1] text-[#24413A] rounded-2xl rounded-bl-sm px-5 py-4 shadow-xs border border-[#2E4F42]/10 text-sm flex gap-2 items-center">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#1B332C]/50 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#1B332C]/50 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-[#1B332C]/50 rounded-full animate-bounce delay-150"></span>
                    </div>
                    <span className="text-xs font-medium text-[#24413A]/80 italic">
                      Analyzing your learning data & saving to history...
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-[#2E4F42]/10 bg-white">
          <div className="flex flex-wrap gap-2 mb-3">
            {SUGGESTED_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handlePromptClick(prompt)}
                className="text-xs px-3 py-1.5 rounded-full border border-[#C4952A]/40 text-[#1B332C] bg-[#FBF8F0] hover:bg-[#EDE6D3] transition-colors"
                disabled={loading || historyLoading}
              >
                {prompt}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your learning journey..."
              className="flex-1 rounded-xl border border-[var(--color-border)] bg-[#FBF8F0] px-4 py-3 text-sm text-[var(--color-text-h)] focus:border-[#1B332C] focus:outline-none focus:ring-2 focus:ring-[#1B332C]/10 transition-shadow"
              disabled={loading || historyLoading}
            />
            <Button
              type="submit"
              disabled={!input.trim() || loading || historyLoading}
              className="shrink-0 px-6 shadow-sm"
            >
              Send
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

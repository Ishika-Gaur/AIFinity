import React, { useState, useEffect, useRef, useCallback } from "react";
import { personalIntelligenceService } from "../services/personalIntelligenceService";
import Button from "../components/Button";
import { useNavigate } from "react-router-dom";

const DEFAULT_WELCOME_MESSAGE = {
  role: "assistant",
  content:
    "Hello! I am AIFinity Personal Intelligence. I have direct access to your assessment scores, mistake patterns, and roadmap.\n\nAsk me anything about your performance, or pick a prompt below to get started!",
  createdAt: new Date().toISOString(),
};

const SUGGESTED_PROMPTS = [
  "What should I study today?",
  "Explain my weakest topic",
  "Analyze my mistakes",
  "How can I improve my score?",
  "Create a study plan for me",
];

export default function PersonalIntelligence() {
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [activeSessionTitle, setActiveSessionTitle] = useState("New Chat");
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const scrollContainerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const navigate = useNavigate();

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // ── 1. Fetch all user sessions on mount
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const list = await personalIntelligenceService.listSessions();
      setSessions(list);
      if (list.length > 0) {
        // Load the most recent session
        const first = list[0];
        setActiveSessionId(first.id);
        setActiveSessionTitle(first.title);
        await selectSession(first.id);
      } else {
        // Start fresh with a blank conversation
        setActiveSessionId(null);
        setActiveSessionTitle("New Chat");
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch (err) {
      console.error("[PersonalIntelligence] Load sessions error:", err);
      setMessages([DEFAULT_WELCOME_MESSAGE]);
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // ── 2. Select and load messages for a specific session
  const selectSession = async (sessionId) => {
    if (!sessionId) return;
    setActiveSessionId(sessionId);
    setLoadingMessages(true);
    try {
      const data = await personalIntelligenceService.getSessionMessages(sessionId);
      setActiveSessionTitle(data.session?.title || "Chat");
      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
      } else {
        setMessages([DEFAULT_WELCOME_MESSAGE]);
      }
    } catch (err) {
      console.error("[PersonalIntelligence] Select session error:", err);
    } finally {
      setLoadingMessages(false);
      setSidebarOpen(false); // Close drawer on mobile
    }
  };

  // ── 3. Start a New Chat
  const handleNewChat = () => {
    setActiveSessionId(null);
    setActiveSessionTitle("New Chat");
    setMessages([DEFAULT_WELCOME_MESSAGE]);
    setInput("");
    setSidebarOpen(false);
  };

  // ── 4. Send Message (Persists to active session or creates new session)
  const sendMessage = async (messageText) => {
    const text = (messageText || input).trim();
    if (!text || loading) return;

    const userMessage = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const chatHistory = [...messages, userMessage];
      const res = await personalIntelligenceService.chat(chatHistory, activeSessionId);

      const assistantMessage = {
        role: "assistant",
        content: res.message,
        createdAt: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      if (res.session) {
        setActiveSessionId(res.session.id);
        setActiveSessionTitle(res.session.title);

        // Update sessions list
        setSessions((prev) => {
          const exists = prev.some((s) => s.id === res.session.id);
          if (exists) {
            return prev.map((s) =>
              s.id === res.session.id
                ? { ...s, title: res.session.title, lastMessageAt: res.session.lastMessageAt }
                : s
            );
          } else {
            return [res.session, ...prev];
          }
        });
      }
    } catch (err) {
      console.error("[PersonalIntelligence] Send message error:", err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Unable to generate your insight right now. Please check your connection and try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ── 5. Delete specific session
  const handleDeleteSession = async (e, sessionId) => {
    e.stopPropagation();
    if (!window.confirm("Delete this conversation?")) return;

    setDeletingId(sessionId);
    try {
      await personalIntelligenceService.deleteSession(sessionId);
      const remaining = sessions.filter((s) => s.id !== sessionId);
      setSessions(remaining);

      if (activeSessionId === sessionId) {
        if (remaining.length > 0) {
          selectSession(remaining[0].id);
        } else {
          handleNewChat();
        }
      }
    } catch (err) {
      console.error("[PersonalIntelligence] Delete session error:", err);
      alert("Failed to delete chat session.");
    } finally {
      setDeletingId(null);
    }
  };

  // ── 6. Clear all sessions
  const handleClearAll = async () => {
    if (!window.confirm("Clear all previous chat conversations? This cannot be undone.")) {
      return;
    }

    try {
      await personalIntelligenceService.clearAllSessions();
      setSessions([]);
      handleNewChat();
    } catch (err) {
      console.error("[PersonalIntelligence] Clear all error:", err);
      alert("Failed to clear conversations.");
    }
  };

  return (
    <div className="flex h-[calc(100vh-70px)] bg-[#FBF8F0] overflow-hidden text-[#1B332C]">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* LEFT SIDEBAR: ChatGPT-Style Chat History                      */}
      {/* ───────────────────────────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-72 bg-[#1B332C] text-[#FBF8F0] p-4 flex flex-col justify-between transition-transform duration-300 md:relative md:translate-x-0 md:h-full shadow-2xl md:shadow-none ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          {/* Sidebar Top: New Chat & Mobile Close */}
          <div className="flex items-center justify-between gap-2 pb-4 border-b border-[#2E4F42]">
            <button
              onClick={handleNewChat}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#EDE6D3] hover:bg-[#E8C547] px-4 py-2.5 text-xs font-bold text-[#1B332C] shadow-sm transition-all duration-200 cursor-pointer group"
            >
              <span className="text-base group-hover:rotate-90 transition-transform duration-200">＋</span>
              <span>New Chat</span>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-[#FBF8F0]/70 hover:text-white rounded-lg hover:bg-[#2E4F42]"
              title="Close sidebar"
            >
              ✕
            </button>
          </div>

          {/* Session List Title */}
          <div className="pt-4 pb-2 px-2 flex items-center justify-between text-[11px] font-mono font-bold tracking-wider text-[#C4952A] uppercase">
            <span>Previous Chats</span>
            {sessions.length > 0 && (
              <span className="bg-[#2E4F42] text-[#FBF8F0] px-1.5 py-0.5 rounded text-[10px]">
                {sessions.length}
              </span>
            )}
          </div>

          {/* Sessions Scrollable List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 py-1">
            {loadingSessions ? (
              <div className="flex items-center gap-2 p-3 text-xs text-[#8B9690]">
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[#E8C547] border-t-transparent" />
                Loading chats…
              </div>
            ) : sessions.length === 0 ? (
              <div className="p-4 text-center text-xs text-[#8B9690] italic">
                No previous conversations yet. Start a new chat!
              </div>
            ) : (
              sessions.map((s) => {
                const isActive = activeSessionId === s.id;
                return (
                  <div
                    key={s.id}
                    onClick={() => selectSession(s.id)}
                    className={`group relative flex items-center justify-between rounded-xl px-3 py-2.5 text-xs transition-all duration-200 cursor-pointer ${
                      isActive
                        ? "bg-[#EDE6D3] text-[#1B332C] font-bold shadow-xs border-l-4 border-[#C4952A]"
                        : "text-[#FBF8F0]/80 hover:bg-[#2E4F42] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate pr-6">
                      <span className="text-sm shrink-0">{isActive ? "💬" : "💭"}</span>
                      <span className="truncate">{s.title || "New Chat"}</span>
                    </div>

                    {/* Delete button on hover */}
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      disabled={deletingId === s.id}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 hover:text-[#C1443C] p-1 rounded transition-opacity"
                      title="Delete chat"
                    >
                      {deletingId === s.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent inline-block" />
                      ) : (
                        "🗑️"
                      )}
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Sidebar Bottom: Clear All & Dashboard Links */}
          <div className="pt-3 border-t border-[#2E4F42] space-y-2">
            {sessions.length > 1 && (
              <button
                onClick={handleClearAll}
                className="w-full text-left px-3 py-2 text-xs font-semibold text-[#C1443C] hover:bg-[#2E4F42] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                <span>🗑️</span>
                <span>Clear all previous chats</span>
              </button>
            )}
            <button
              onClick={() => navigate("/dashboard")}
              className="w-full text-left px-3 py-2 text-xs font-semibold text-[#E8C547] hover:bg-[#2E4F42] rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              <span>←</span>
              <span>Back to Dashboard</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for mobile drawer */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MAIN CHAT VIEW: Header + Message Stream + Input Bar           */}
      {/* ───────────────────────────────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#FBF8F0]">
        {/* Top Chat Bar */}
        <header className="h-14 border-b border-[#2E4F42]/15 px-4 sm:px-6 flex items-center justify-between bg-white/70 backdrop-blur-xs shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-xl border border-[#2E4F42]/15 bg-white text-[#1B332C] hover:bg-[#EDE6D3] text-sm"
              title="Open Chat History"
            >
              ☰
            </button>
            <div>
              <h2 className="font-sans text-sm sm:text-base font-bold text-[#1B332C] truncate max-w-xs sm:max-w-md">
                {activeSessionTitle}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNewChat}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#2E4F42]/15 bg-white px-3 py-1.5 text-xs font-bold text-[#1B332C] hover:bg-[#EDE6D3] transition-colors shadow-2xs cursor-pointer"
            >
              <span>＋</span>
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <Button size="sm" variant="outline" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
          </div>
        </header>

        {/* Message View Area */}
        <div
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-5"
          ref={scrollContainerRef}
        >
          {loadingMessages ? (
            <div className="flex h-full items-center justify-center py-20">
              <div className="flex items-center gap-3 text-sm text-[#5B6B5F] font-semibold">
                <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#1B332C] border-t-transparent" />
                Loading conversation…
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-5">
              {messages.map((msg, idx) => {
                const isUser = msg.role === "user";
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                  >
                    <div
                      className={`max-w-[90%] sm:max-w-[80%] rounded-2xl px-5 py-3.5 text-sm leading-relaxed ${
                        isUser
                          ? "bg-[#1B332C] text-white rounded-br-sm shadow-md"
                          : "bg-white text-[#24413A] rounded-bl-sm shadow-xs border border-[#2E4F42]/12"
                      }`}
                      style={{ whiteSpace: "pre-wrap" }}
                    >
                      {!isUser && (
                        <div className="flex items-center gap-1.5 mb-2 pb-1.5 border-b border-[#2E4F42]/10">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#C4952A] font-mono">
                            ✦ Personal Intelligence
                          </span>
                        </div>
                      )}
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
                );
              })}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-[#24413A] rounded-2xl rounded-bl-sm px-5 py-3.5 shadow-xs border border-[#2E4F42]/12 text-sm flex gap-2 items-center">
                    <div className="flex gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#1B332C] rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-[#1B332C] rounded-full animate-bounce delay-75"></span>
                      <span className="w-1.5 h-1.5 bg-[#1B332C] rounded-full animate-bounce delay-150"></span>
                    </div>
                    <span className="text-xs font-medium text-[#5B6B5F] italic">
                      Reviewing your assessment history & generating focus...
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input & Suggested Prompts Bar */}
        <footer className="border-t border-[#2E4F42]/15 bg-white/90 backdrop-blur-xs p-4 sm:p-6 shrink-0">
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Suggested Prompt Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  disabled={loading || loadingMessages}
                  className="whitespace-nowrap text-xs px-3.5 py-1.5 rounded-full border border-[#C4952A]/40 text-[#1B332C] bg-[#FBF8F0] hover:bg-[#EDE6D3] transition-colors disabled:opacity-50 cursor-pointer shrink-0"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex items-center gap-2 rounded-2xl border border-[#2E4F42]/20 bg-[#FBF8F0] p-1.5 shadow-xs focus-within:border-[#1B332C] focus-within:ring-2 focus-within:ring-[#1B332C]/10 transition-all"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your learning journey, mistakes, or next steps..."
                className="flex-1 bg-transparent px-4 py-2.5 text-sm text-[#1B332C] placeholder-[#8B9690] outline-none"
                disabled={loading || loadingMessages}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading || loadingMessages}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#1B332C] hover:bg-[#2E4F42] px-5 py-2.5 text-xs font-bold text-[#E8C547] shadow-sm transition-all duration-200 disabled:opacity-40 cursor-pointer shrink-0"
              >
                <span>Send</span>
                <span>→</span>
              </button>
            </form>
          </div>
        </footer>
      </main>
    </div>
  );
}

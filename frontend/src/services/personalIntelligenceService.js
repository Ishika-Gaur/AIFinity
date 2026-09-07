import { personalIntelligenceApi } from "./api";

export const personalIntelligenceService = {
  /**
   * Send chat messages to AI within a session and get response
   */
  chat: async (messages, sessionId = null) => {
    const res = await personalIntelligenceApi.chat(messages, sessionId);
    if (!res.success) {
      throw new Error(res.error || "Failed to communicate with AI");
    }
    return {
      message: res.message,
      session: res.session,
    };
  },

  /**
   * List all past chat sessions
   */
  listSessions: async () => {
    const res = await personalIntelligenceApi.listSessions();
    if (!res.success) {
      throw new Error(res.error || "Failed to load chat sessions");
    }
    return res.sessions || [];
  },

  /**
   * Create a new blank chat session
   */
  createSession: async (title = "New Chat") => {
    const res = await personalIntelligenceApi.createSession(title);
    if (!res.success) {
      throw new Error(res.error || "Failed to create new chat");
    }
    return res.session;
  },

  /**
   * Load messages for a specific session
   */
  getSessionMessages: async (sessionId) => {
    const res = await personalIntelligenceApi.getSessionMessages(sessionId);
    if (!res.success) {
      throw new Error(res.error || "Failed to load session messages");
    }
    return {
      session: res.session,
      messages: res.messages || [],
    };
  },

  /**
   * Delete a specific chat session
   */
  deleteSession: async (sessionId) => {
    const res = await personalIntelligenceApi.deleteSession(sessionId);
    if (!res.success) {
      throw new Error(res.error || "Failed to delete chat session");
    }
    return res.message;
  },

  /**
   * Clear all chat sessions
   */
  clearAllSessions: async () => {
    const res = await personalIntelligenceApi.clearAllSessions();
    if (!res.success) {
      throw new Error(res.error || "Failed to clear all conversations");
    }
    return res.message;
  },
};

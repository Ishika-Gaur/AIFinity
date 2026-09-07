import { personalIntelligenceApi } from "./api";

export const personalIntelligenceService = {
  /**
   * Send chat messages to AI and get response
   */
  chat: async (messages) => {
    const res = await personalIntelligenceApi.chat(messages);
    if (!res.success) {
      throw new Error(res.error || "Failed to communicate with AI");
    }
    return res.message;
  },

  /**
   * Fetch chat history for the authenticated user
   */
  getHistory: async () => {
    const res = await personalIntelligenceApi.getHistory();
    if (!res.success) {
      throw new Error(res.error || "Failed to load chat history");
    }
    return res.history || [];
  },

  /**
   * Clear chat history for the authenticated user
   */
  clearHistory: async () => {
    const res = await personalIntelligenceApi.clearHistory();
    if (!res.success) {
      throw new Error(res.error || "Failed to clear chat history");
    }
    return res.message;
  },
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

async function request(endpoint, options = {}) {
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  const config = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
    credentials: "include", // CRITICAL: Ensures HTTP-only cookies are sent/received
  };

  const url = `${API_BASE_URL}${endpoint}`;

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      let message = data.message;
      if (!message) {
        switch (res.status) {
          case 400:
            message = "Bad request (400): Invalid input or status value.";
            break;
          case 401:
            message = "Unauthorized (401): Session expired or authentication required. Please log in.";
            break;
          case 403:
            message = "Forbidden (403): Administrator privileges required.";
            break;
          case 404:
            message = "Not found (404): The requested resource could not be found.";
            break;
          case 500:
            message = "Server error (500): The server encountered an unexpected error.";
            break;
          default:
            message = `Request failed with status ${res.status}`;
        }
      }

      console.error(`[API Error] ${options.method || "GET"} ${url} responded with status ${res.status}:`, message, data);

      return {
        success: false,
        status: res.status,
        error: message,
        message,
        data,
      };
    }

    return {
      success: true,
      status: res.status,
      ...data,
    };
  } catch (err) {
    let errorMsg = err.message || "Network error. Failed to reach server.";
    if (err.message === "Failed to fetch" || err.name === "TypeError") {
      errorMsg = "Network error: Failed to fetch (Server might be unreachable or request blocked by CORS).";
    }

    console.error(`[API Network Error] ${options.method || "GET"} ${url}:`, err);

    return {
      success: false,
      status: 0,
      error: errorMsg,
      message: errorMsg,
    };
  }
}

export const authApi = {
  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, password) =>
    request(`/auth/reset-password/${token}`, {
      method: "POST",
      body: JSON.stringify({ password }),
    }),

  logout: () =>
    request("/auth/logout", {
      method: "POST",
    }),

  getMe: () =>
    request("/auth/me", {
      method: "GET",
    }),

  completeOnboarding: (data) =>
    request("/auth/onboarding", {
      method: "PUT",
      body: JSON.stringify(data),
    }),

  updateProfile: (data) =>
    request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(data),
    }),
};

export const adminApi = {
  getUsers: () => request("/admin/users"),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
  getAnalytics: () => request("/admin/analytics"),
  getContent: () => request("/admin/content"),
  createContent: (content) =>
    request("/admin/content", {
      method: "POST",
      body: JSON.stringify(content),
    }),
  deleteContent: (id) =>
    request(`/admin/content/${id}`, {
      method: "DELETE",
    }),
  getReports: () => request("/admin/reports"),
  getSettings: () => request("/admin/settings"),
  updateSettings: (settings) =>
    request("/admin/settings", {
      method: "PUT",
      body: JSON.stringify(settings),
    }),
  getCourseRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/course-requests${query ? `?${query}` : ""}`);
  },
  getCourseRequestById: (id) => request(`/admin/course-requests/${id}`),
  updateCourseRequestStatus: (id, status) =>
    request(`/admin/course-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

export const assessmentApi = {
  getPublished: () => request("/assessments"),
  getById: (id) => request(`/assessments/${id}`),
  startAttempt: (id) => request(`/assessments/${id}/start`),
  submitAttempt: (id, payload) =>
    request(`/assessments/${id}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  evaluateAI: (id, payload) =>
    request(`/assessments/${id}/evaluate-ai`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  syncAttempt: (payload) =>
    request("/assessments/sync-attempt", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAllForAdmin: () => request("/assessments/admin/all"),
  create: (assessment) => request("/assessments/admin", { method: "POST", body: JSON.stringify(assessment) }),
  update: (id, assessment) => request(`/assessments/admin/${id}`, { method: "PUT", body: JSON.stringify(assessment) }),
  remove: (id) => request(`/assessments/admin/${id}`, { method: "DELETE" }),
  getPersonalized: () => request("/assessments/personalized"),
  generateAI: (payload) => request("/assessments/generate-ai", { method: "POST", body: JSON.stringify(payload) }),
  generateDailyAI: (targetDate) => request("/assessments/daily-generate", { method: "POST", body: JSON.stringify(targetDate ? { targetDate } : {}) }),
  getDailyStatus: () => request("/assessments/daily-status"),
};

export const analyticsApi = {
  getRoadmap: () => request("/analytics/roadmap"),
  updateRoadmap: (payload) =>
    request("/analytics/roadmap", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  getProjectIdeas: (topic, field) => request(`/analytics/project-ideas?topic=${encodeURIComponent(topic)}&field=${encodeURIComponent(field)}`),
};

export const dashboardApi = {
  /**
   * GET /api/dashboard
   * Returns fully aggregated dashboard data for the authenticated user.
   * All metrics are computed from real attempt history — no mock data.
   */
  get: () => request("/dashboard"),

  /**
   * PUT /api/dashboard/career-goal
   * Persists the user's updated career goal to their profile in the database.
   */
  updateCareerGoal: (goal) =>
    request("/dashboard/career-goal", {
      method: "PUT",
      body: JSON.stringify(goal),
    }),
};

export const conceptRootApi = {
  /**
   * GET /api/concept-root
   * Returns fully personalized ConceptRoot analysis data.
   */
  get: () => request("/concept-root"),

  /**
   * POST /api/concept-root/analyze
   * Live AI diagnostic analysis for ConceptRoot submission.
   */
  analyze: (payload) =>
    request("/concept-root/analyze", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
};

export const mistakeMapApi = {
  /**
   * GET /api/mistake-map
   * Returns fully personalized Mistake Map analysis data with AI recommendations.
   */
  get: () => request("/mistake-map"),

  /**
   * GET /api/mistake-map/statistics
   * Returns telemetry statistics without AI latency.
   */
  getStatistics: () => request("/mistake-map/statistics"),

  /**
   * GET /api/mistake-map/patterns
   * Returns recurring weaknesses and before/now trends.
   */
  getPatterns: () => request("/mistake-map/patterns"),

  /**
   * POST /api/mistake-map/ai-insights
   * Generates or refreshes on-demand AI recommendations.
   */
  getAIInsights: () =>
    request("/mistake-map/ai-insights", {
      method: "POST",
    }),
};

export const skillGapApi = {
  /**
   * GET /api/skill-gap
   * Returns fully personalized Skill Gap analysis data.
   */
  get: () => request("/skill-gap"),
};

export const roadmapApi = {
  /**
   * GET /api/roadmap
   * Returns fully personalized learning roadmap data.
   */
  get: () => request("/roadmap"),
};

export const personalIntelligenceApi = {
  /**
   * POST /api/personal-intelligence/chat
   * Interactive chat completion with personal AI within a session
   */
  chat: (messages, sessionId = null) =>
    request("/personal-intelligence/chat", {
      method: "POST",
      body: JSON.stringify({ messages, sessionId }),
    }),

  /**
   * GET /api/personal-intelligence/sessions
   * List all conversation sessions for user
   */
  listSessions: () => request("/personal-intelligence/sessions"),

  /**
   * POST /api/personal-intelligence/sessions
   * Create a new blank session
   */
  createSession: (title = "New Chat") =>
    request("/personal-intelligence/sessions", {
      method: "POST",
      body: JSON.stringify({ title }),
    }),

  /**
   * GET /api/personal-intelligence/sessions/:id/messages
   * Load all messages for a specific session
   */
  getSessionMessages: (sessionId) =>
    request(`/personal-intelligence/sessions/${sessionId}/messages`),

  /**
   * DELETE /api/personal-intelligence/sessions/:id
   * Delete a specific chat session
   */
  deleteSession: (sessionId) =>
    request(`/personal-intelligence/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  /**
   * DELETE /api/personal-intelligence/sessions
   * Clears all conversations
   */
  clearAllSessions: () =>
    request("/personal-intelligence/sessions", {
      method: "DELETE",
    }),
};

export const courseRequestApi = {
  create: (data) =>
    request("/course-requests", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMyRequests: () => request("/course-requests/my"),
  getAdminRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/admin/course-requests${query ? `?${query}` : ""}`);
  },
  getAdminRequestById: (id) => request(`/admin/course-requests/${id}`),
  updateAdminRequestStatus: (id, status) =>
    request(`/admin/course-requests/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
};

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

  try {
    const res = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      return {
        success: false,
        status: res.status,
        error: data.message || `Request failed with status ${res.status}`,
      };
    }

    return {
      success: true,
      status: res.status,
      ...data,
    };
  } catch (err) {
    return {
      success: false,
      error: err.message || "Network error. Failed to reach server.",
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
  generateDailyAI: () => request("/assessments/daily-generate", { method: "POST" }),
  getDailyStatus: () => request("/assessments/daily-status"),
};

export const analyticsApi = {
  getSkillGap: () => request("/analytics/skill-gap"),
  getMistakeMap: () => request("/analytics/mistake-map"),
  getConceptRoot: () => request("/analytics/concept-root"),
  getRoadmap: () => request("/analytics/roadmap"),
  updateRoadmap: (payload) =>
    request("/analytics/roadmap", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
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
   * Returns fully personalized Mistake Map analysis data.
   */
  get: () => request("/mistake-map"),
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
   * Interactive chat completion with personal AI
   */
  chat: (messages) =>
    request("/personal-intelligence/chat", {
      method: "POST",
      body: JSON.stringify({ messages }),
    }),

  /**
   * GET /api/personal-intelligence/history
   * Fetches conversation history for authenticated user
   */
  getHistory: () => request("/personal-intelligence/history"),

  /**
   * DELETE /api/personal-intelligence/history
   * Clears conversation history for authenticated user
   */
  clearHistory: () =>
    request("/personal-intelligence/history", {
      method: "DELETE",
    }),
};

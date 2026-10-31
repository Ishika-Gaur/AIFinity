import { assessmentApi } from "./api";



export async function createAttemptSession(assessmentId) {
  try {
    const apiRes = await assessmentApi.startAttempt(assessmentId);
    if (apiRes && apiRes.success && apiRes.assessment) {
      return {
        success: true,
        attemptId: apiRes.attemptId,
        assessment: apiRes.assessment,
        isRemote: true,
      };
    }
    return {
      success: false,
      status: apiRes?.status || 400,
      error: apiRes?.message || apiRes?.error || "Failed to start attempt",
    };
  } catch (err) {
    console.error("Backend startAttempt error:", err);
    return {
      success: false,
      status: err.status || 500,
      error: err.message || "Failed to start attempt",
    };
  }
}

export async function getLatestAttemptResult(assessmentId) {
  try {
    const apiRes = await assessmentApi.getLatestResult(assessmentId);
    if (apiRes && apiRes.success && apiRes.result) {
      return {
        success: true,
        result: apiRes.result,
      };
    }
    return {
      success: false,
      status: apiRes?.status || 404,
      error: apiRes?.message || apiRes?.error || "No completed result found",
    };
  } catch (err) {
    console.error("Backend getLatestResult error:", err);
    return {
      success: false,
      status: err.status || 500,
      error: err.message || "Failed to fetch completed result",
    };
  }
}

export async function submitAttemptSession(assessmentId, attemptId, responses, elapsedSeconds, violations = []) {
  const payload = {
    attemptId,
    responses,
    elapsedSeconds,
    violations,
    assessmentTitle: "Assessment Attempt",
    assessmentCategory: "General",
    assessmentField: "",
  };

  try {
    const apiRes = await assessmentApi.submitAttempt(assessmentId, payload);
    if (apiRes && apiRes.success) {
      return apiRes;
    }
    throw new Error(apiRes?.error || "Failed to submit attempt");
  } catch (err) {
    console.error("Backend submitAttempt error:", err);
    throw err;
  }
}

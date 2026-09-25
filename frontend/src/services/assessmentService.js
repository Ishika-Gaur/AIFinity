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
    throw new Error(apiRes?.error || "Failed to start attempt");
  } catch (err) {
    console.error("Backend startAttempt error:", err);
    throw err;
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
      if (attemptId) attemptSessionCache.delete(attemptId);
      return apiRes;
    }
    throw new Error(apiRes?.error || "Failed to submit attempt");
  } catch (err) {
    console.error("Backend submitAttempt error:", err);
    throw err;
  }
}

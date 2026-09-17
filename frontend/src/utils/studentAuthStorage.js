const STUDENT_USER_KEY = "aifinity_student_user";
const LEGACY_SHARED_USER_KEY = "user";

function canUseStorage() {
  return typeof window !== "undefined" && window.localStorage;
}

export function purgeLegacySharedUserCache() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(LEGACY_SHARED_USER_KEY);
  } catch (_) {}
}

export function isStudentUser(user) {
  return Boolean(user && user.role === "student");
}

export function readCachedStudentUser() {
  if (!canUseStorage()) return null;
  purgeLegacySharedUserCache();
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STUDENT_USER_KEY) || "null");
    if (!isStudentUser(parsed)) {
      window.localStorage.removeItem(STUDENT_USER_KEY);
      return null;
    }
    return parsed;
  } catch {
    try {
      window.localStorage.removeItem(STUDENT_USER_KEY);
    } catch (_) {}
    return null;
  }
}

export function persistStudentUser(user) {
  if (!canUseStorage()) return;
  purgeLegacySharedUserCache();
  try {
    if (isStudentUser(user)) {
      window.localStorage.setItem(STUDENT_USER_KEY, JSON.stringify(user));
    } else {
      window.localStorage.removeItem(STUDENT_USER_KEY);
    }
  } catch (_) {}
}

export function clearStudentUserCache() {
  if (!canUseStorage()) return;
  try {
    window.localStorage.removeItem(STUDENT_USER_KEY);
    window.localStorage.removeItem(LEGACY_SHARED_USER_KEY);
    window.localStorage.removeItem("aifinity_onboarding_profile");
  } catch (_) {}
}

export function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("authChange"));
}

export function isNetworkAuthError(error) {
  if (!error) return false;
  return (
    error.includes("Network") ||
    error.includes("Failed to fetch") ||
    error.includes("Failed to reach server")
  );
}

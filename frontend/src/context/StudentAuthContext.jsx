import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { authApi } from "../services/api";
import {
  clearStudentUserCache,
  isNetworkAuthError,
  isStudentUser,
  persistStudentUser,
  purgeLegacySharedUserCache,
  readCachedStudentUser,
  notifyAuthChange,
} from "../utils/studentAuthStorage";

const StudentAuthContext = createContext(null);

export function StudentAuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedStudentUser());
  // If we have a valid cached user, we can start with loading=false and verify
  // the session in the background. If no cache exists, we must wait for the
  // API before rendering auth-dependent UI (loading=true blocks the CTAs).
  const [loading, setLoading] = useState(() => readCachedStudentUser() === null);
  const ignoreNextAuthEvent = useRef(false);
  // Tracks the most recent fetch so stale concurrent calls never overwrite a
  // newer result (guards against React StrictMode double-invoke in dev).
  const fetchIdRef = useRef(0);

  const applySession = useCallback((nextUser) => {
    if (isStudentUser(nextUser)) {
      setUser(nextUser);
      persistStudentUser(nextUser);
    } else {
      setUser(null);
      clearStudentUserCache();
    }
    ignoreNextAuthEvent.current = true;
    notifyAuthChange();
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    // Assign a unique id to this invocation so we can discard stale results.
    const fetchId = ++fetchIdRef.current;
    purgeLegacySharedUserCache();

    try {
      const res = await authApi.getMe();

      // Discard result if a newer fetch has already started.
      if (fetchId !== fetchIdRef.current) return null;

      if (res.success && isStudentUser(res.user)) {
        setUser(res.user);
        persistStudentUser(res.user);
        return res.user;
      }

      if (res.status === 401 || (res.success && res.user && !isStudentUser(res.user))) {
        setUser(null);
        clearStudentUserCache();
        return null;
      }

      if (isNetworkAuthError(res?.error)) {
        const cached = readCachedStudentUser();
        setUser(cached);
        return cached;
      }

      setUser(null);
      clearStudentUserCache();
      return null;
    } catch {
      if (fetchId !== fetchIdRef.current) return null;
      setUser(null);
      clearStudentUserCache();
      return null;
    } finally {
      // Only update loading if this is still the latest fetch.
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();

    const onAuthChange = () => {
      if (ignoreNextAuthEvent.current) {
        ignoreNextAuthEvent.current = false;
        return;
      }
      fetchCurrentUser();
    };

    window.addEventListener("authChange", onAuthChange);
    window.addEventListener("storage", onAuthChange);

    return () => {
      window.removeEventListener("authChange", onAuthChange);
      window.removeEventListener("storage", onAuthChange);
    };
  }, [fetchCurrentUser]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error(e);
    }
    setUser(null);
    clearStudentUserCache();
    notifyAuthChange();
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: !!user,
      applySession,
      refreshUser: fetchCurrentUser,
      logout,
    }),
    [user, loading, applySession, fetchCurrentUser, logout]
  );

  return (
    <StudentAuthContext.Provider value={value}>
      {children}
    </StudentAuthContext.Provider>
  );
}

export function useStudentAuth() {
  const context = useContext(StudentAuthContext);
  if (!context) {
    throw new Error("useStudentAuth must be used within a StudentAuthProvider");
  }
  return context;
}

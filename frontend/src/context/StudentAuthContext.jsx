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
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const ignoreNextAuthEvent = useRef(false);

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
    purgeLegacySharedUserCache();

    try {
      const res = await authApi.getMe();

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
      setUser(null);
      clearStudentUserCache();
      return null;
    } finally {
      setLoading(false);
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

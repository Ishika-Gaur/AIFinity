import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../services/api";
import { clearStudentUserCache, notifyAuthChange } from "../utils/studentAuthStorage";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState(null);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const res = await authApi.getMe();
      if (res.success && res.user && res.user.role === "admin") {
        setUser(res.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    const onAuthChange = () => fetchCurrentUser();
    window.addEventListener("authChange", onAuthChange);
    return () => window.removeEventListener("authChange", onAuthChange);
  }, [fetchCurrentUser]);

  const login = async (email, password) => {
    setLoading(true);
    const res = await authApi.login(email, password);

    if (res.success && res.user) {
      if (res.user.role !== "admin") {
        await authApi.logout();
        setUser(null);
        clearStudentUserCache();
        notifyAuthChange();
        setLoading(false);
        return {
          user: null,
          error: "Access denied. Account is not authorized as system administrator.",
        };
      }

      setUser(res.user);
      clearStudentUserCache();
      notifyAuthChange();
      setLoading(false);
      return { user: res.user, error: null };
    }

    setLoading(false);
    return { user: null, error: res.error || "Login failed" };
  };

  const logout = async () => {
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const res = await authApi.logout();
      setUser(null);
      clearStudentUserCache();
      notifyAuthChange();
      setIsLoggingOut(false);
      if (res.success) {
        return { success: true };
      }
      return { success: false, error: res.error || "Logout failed" };
    } catch (err) {
      setUser(null);
      clearStudentUserCache();
      notifyAuthChange();
      setIsLoggingOut(false);
      const errMsg = err.message || "Failed to sign out.";
      setLogoutError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const value = {
    user,
    loading,
    isAdmin: !!(user && user.role === "admin"),
    isLoggingOut,
    logoutError,
    setLogoutError,
    login,
    logout,
    refreshUser: fetchCurrentUser,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

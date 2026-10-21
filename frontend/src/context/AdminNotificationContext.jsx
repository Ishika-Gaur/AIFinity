import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { adminApi } from "../services/api";

const AdminNotificationContext = createContext(null);

const STORAGE_KEY = "admin_seen_notification_ids";

function getStoredSeenIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistSeenIds(ids) {
  try {
    // Keep max 200 IDs to prevent unbounded storage growth
    const sliced = ids.slice(-200);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sliced));
  } catch (err) {
    console.warn("[AdminNotifications] localStorage error:", err);
  }
}

export function AdminNotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [seenIds, setSeenIds] = useState(() => getStoredSeenIds());
  const [loading, setLoading] = useState(true);
  const [activeToast, setActiveToast] = useState(null);

  const prevPendingCountRef = useRef(null);

  const fetchNotifications = useCallback(async (isPolling = false) => {
    try {
      const res = await adminApi.getNotifications();
      if (res && res.success) {
        const newNotifications = res.notifications || [];
        const currentCount = res.unreadCount || 0;

        // Check if a new course request arrived while on dashboard
        if (
          isPolling &&
          prevPendingCountRef.current !== null &&
          currentCount > prevPendingCountRef.current
        ) {
          const newestReq = newNotifications.find((n) => n.type === "course_request");
          if (newestReq) {
            setActiveToast({
              id: Date.now(),
              title: "🔔 New Course Request Received!",
              message: newestReq.message || "A student requested a new course track.",
              link: "/admin/course-requests",
              courseName: newestReq.data?.courseName,
              requesterName: newestReq.data?.requesterName,
            });
          }
        }

        prevPendingCountRef.current = currentCount;
        setNotifications(newNotifications);
        setPendingCount(currentCount);
      }
    } catch (err) {
      console.warn("[AdminNotifications] Polling error:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and 15s polling
  useEffect(() => {
    fetchNotifications(false);

    const interval = setInterval(() => {
      fetchNotifications(true);
    }, 15000);

    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  const dismissToast = () => setActiveToast(null);

  // Mark all current notifications as seen
  const markAllAsSeen = useCallback(() => {
    setSeenIds((prev) => {
      const allCurrentIds = notifications.map((n) => n.id);
      const merged = Array.from(new Set([...prev, ...allCurrentIds]));
      persistSeenIds(merged);
      return merged;
    });
  }, [notifications]);

  // Mark a single notification as seen
  const markAsSeen = useCallback((id) => {
    if (!id) return;
    setSeenIds((prev) => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      persistSeenIds(updated);
      return updated;
    });
  }, []);

  // Calculate unseen notifications count
  const unseenCount = notifications.filter((n) => !seenIds.includes(n.id)).length;

  // Augment notification objects with isSeen boolean
  const notificationsWithSeenState = notifications.map((n) => ({
    ...n,
    isSeen: seenIds.includes(n.id),
  }));

  return (
    <AdminNotificationContext.Provider
      value={{
        notifications: notificationsWithSeenState,
        unreadCount: unseenCount, // Controls the bell badge: unseen count
        unseenCount,
        pendingCount, // Total requests pending review
        loading,
        activeToast,
        dismissToast,
        markAllAsSeen,
        markAsSeen,
        refreshNotifications: () => fetchNotifications(false),
      }}
    >
      {children}
    </AdminNotificationContext.Provider>
  );
}

export function useAdminNotifications() {
  const context = useContext(AdminNotificationContext);
  if (!context) {
    return {
      notifications: [],
      unreadCount: 0,
      unseenCount: 0,
      pendingCount: 0,
      loading: false,
      activeToast: null,
      dismissToast: () => {},
      markAllAsSeen: () => {},
      markAsSeen: () => {},
      refreshNotifications: () => {},
    };
  }
  return context;
}

import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { useAdminNotifications } from "../../context/AdminNotificationContext";

function formatTimeAgo(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);
  if (seconds < 60) return "Just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminHeader({ onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAdminAuth();
  const {
    notifications,
    unreadCount,
    unseenCount,
    loading,
    markAllAsSeen,
    markAsSeen,
    refreshNotifications,
  } = useAdminNotifications();

  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef(null);

  // Close notifications dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showNotifications]);

  const handleLogout = async () => {
    const res = await logout();
    if (res?.success) {
      navigate("/admin/login");
    }
  };

  const handleToggleNotifications = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    if (nextState) {
      // Refresh to ensure newest list and immediately mark all as seen
      refreshNotifications();
      markAllAsSeen();
    }
  };

  const getPageTitle = () => {
    switch (location.pathname) {
      case "/admin":
      case "/admin/":
      case "/admin/dashboard":
        return "System Overview";
      case "/admin/users":
        return "User Management & Access Control";
      case "/admin/analytics":
        return "AI Features & Request Analytics";
      case "/admin/content":
        return "Uploaded & Generated Content";
      case "/admin/course-requests":
        return "Course Requests & Domain Inquiries";
      case "/admin/assessments":
        return "Assessments & Skill Tests";
      case "/admin/reports":
        return "Platform Reports & Performance Logs";
      case "/admin/settings":
        return "System & Security Settings";
      default:
        return "Admin Portal";
    }
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          aria-label="Open Sidebar Menu"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 lg:hidden"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div>
          <h1 className="text-lg font-bold text-slate-900 leading-tight">
            {getPageTitle()}
          </h1>
          <p className="hidden text-xs text-slate-400 sm:block">
            AIFinity Administration Panel
          </p>
        </div>
      </div>

      {/* Right: Search, Status, Profile & Logout */}
      <div className="flex items-center gap-4">
        {/* System Health Badge */}
        <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:flex">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          System Operational
        </div>

        {/* Notifications Icon Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={handleToggleNotifications}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            {/* Dynamic Unread Badge (Clears as soon as seen) */}
            {unreadCount > 0 && (
              <>
                <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-extrabold text-white shadow-xs ring-2 ring-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-rose-500 animate-ping opacity-75" />
              </>
            )}
          </button>

          {/* Dropdown Menu */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-84 sm:w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden animate-fade-in">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Notifications
                  </span>
                  {unseenCount > 0 ? (
                    <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                      {unseenCount} New
                    </span>
                  ) : (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      All Caught Up
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {unseenCount > 0 && (
                    <button
                      onClick={markAllAsSeen}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Mark all read
                    </button>
                  )}
                  <button
                    onClick={() => refreshNotifications()}
                    title="Refresh Notifications"
                    className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                  >
                    <svg className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Notification list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 p-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-slate-400">
                    <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-slate-600">No notifications</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      New course requests from onboarding will appear here.
                    </p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isCourseReq = n.type === "course_request";
                    const isUnseen = !n.isSeen;

                    return (
                      <div
                        key={n.id}
                        onClick={() => {
                          markAsSeen(n.id);
                          setShowNotifications(false);
                          navigate(n.link || "/admin/course-requests");
                        }}
                        className={`group flex items-start gap-3 p-3 transition-colors cursor-pointer rounded-xl ${
                          isUnseen
                            ? "bg-indigo-50/50 hover:bg-indigo-50/80"
                            : "hover:bg-slate-50"
                        }`}
                      >
                        {/* Icon */}
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5 ${
                            isCourseReq
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700"
                          }`}
                        >
                          {isCourseReq ? (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <div className="flex items-center gap-1.5 truncate">
                              {isUnseen && (
                                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                              )}
                              <p className={`text-xs truncate ${isUnseen ? "font-bold text-slate-900" : "font-semibold text-slate-700"} group-hover:text-indigo-600 transition-colors`}>
                                {n.title}
                              </p>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                            {n.message}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Footer link to Course Requests */}
              <div className="border-t border-slate-100 bg-slate-50/70 p-2 text-center">
                <Link
                  to="/admin/course-requests"
                  onClick={() => setShowNotifications(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors py-1 px-3 rounded-lg hover:bg-white"
                >
                  Manage all course requests &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 font-bold text-white shadow-sm ring-2 ring-indigo-500/20 text-xs">
            {user?.name ? user.name.substring(0, 2).toUpperCase() : (user?.displayName ? user.displayName.substring(0, 2).toUpperCase() : (user?.email ? user.email.substring(0, 2).toUpperCase() : "AD"))}
          </div>
          <div className="hidden flex-col sm:flex">
            <span className="text-xs font-bold text-slate-900 leading-tight">
              {user?.name || user?.displayName || user?.email || "System Admin"}
            </span>
            <span className="text-[10px] font-semibold text-slate-400 leading-tight">
              Authenticated Admin
            </span>
          </div>

          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            title="Sign Out of Admin Console"
            className="ml-2 flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 px-3 text-xs font-semibold text-slate-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 transition-all disabled:opacity-60 disabled:pointer-events-none"
          >
            {isLoggingOut ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-slate-400 border-t-indigo-600 animate-spin" />
                <span className="hidden sm:inline">Logging out...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="hidden sm:inline">Logout</span>
              </>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}

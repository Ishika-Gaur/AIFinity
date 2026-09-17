import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminHeader({ onOpenSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isLoggingOut } = useAdminAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = async () => {
    const res = await logout();
    if (res?.success) {
      navigate("/admin/login");
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
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-cyan-500 ring-2 ring-white" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl z-50">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                  Recent Alerts
                </span>
                <span className="text-[10px] font-bold text-indigo-600">3 New</span>
              </div>
              <div className="space-y-2 text-xs">
                <div className="rounded-lg bg-indigo-50/60 p-2.5">
                  <p className="font-bold text-slate-900">User Growth Milestone</p>
                  <p className="text-slate-500 text-[11px]">400+ active users logged today</p>
                </div>
                <div className="rounded-lg bg-rose-50/60 p-2.5">
                  <p className="font-bold text-rose-900">Suspended Account Warning</p>
                  <p className="text-rose-600 text-[11px]">User Elena Rostova exceeded rate limits</p>
                </div>
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


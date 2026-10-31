import { useState } from "react";
import { Outlet, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useAdminAuth } from "../../context/AdminAuthContext";
import { AdminNotificationProvider, useAdminNotifications } from "../../context/AdminNotificationContext";

function AdminLayoutInner() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoggingOut, logoutError, setLogoutError } = useAdminAuth();
  const { activeToast, dismissToast } = useAdminNotifications();

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-800">
      {/* Live Course Request Notification Toast */}
      {activeToast && (
        <div className="fixed top-4 right-4 z-50 flex max-w-md items-center gap-3 rounded-2xl border border-indigo-200 bg-white p-4 text-xs font-semibold text-slate-800 shadow-2xl shadow-indigo-900/10 ring-1 ring-indigo-500/10 animate-fade-in">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="font-bold text-slate-900 truncate">{activeToast.title}</span>
            <span className="text-slate-500 text-[11px] truncate">{activeToast.message}</span>
          </div>
          <Link
            to={activeToast.link || "/admin/course-requests"}
            onClick={dismissToast}
            className="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-[11px] font-bold text-white hover:bg-indigo-700 transition-colors shadow-xs"
          >
            Review
          </Link>
          <button
            onClick={dismissToast}
            className="ml-1 rounded-lg p-1 text-slate-400 hover:bg-slate-100 transition-colors"
            aria-label="Dismiss toast"
          >
            ✕
          </button>
        </div>
      )}

      {/* Logout Error Toast Notification */}
      {logoutError && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-3 rounded-2xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-800 shadow-xl animate-fade-in">
          <svg className="w-5 h-5 text-rose-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex flex-col">
            <span className="font-bold">Sign Out Failed</span>
            <span className="text-rose-600">{logoutError}</span>
          </div>
          <button
            onClick={() => setLogoutError(null)}
            className="ml-3 rounded-lg p-1 text-rose-500 hover:bg-rose-100"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Admin UI Container with smooth exit transition */}
      <div
        className={`flex h-full w-full overflow-hidden transition-all duration-300 ease-out motion-reduce:transition-none ${
          isLoggingOut
            ? "opacity-20 scale-[0.995] pointer-events-none filter blur-[1px]"
            : "opacity-100 scale-100"
        }`}
      >
        {/* Admin Sidebar */}
        <AdminSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Administrative Viewport */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Admin Header */}
          <AdminHeader onOpenSidebar={() => setSidebarOpen(true)} />

          {/* Dynamic Admin Page Workspace */}
          <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  return (
    <AdminNotificationProvider>
      <AdminLayoutInner />
    </AdminNotificationProvider>
  );
}

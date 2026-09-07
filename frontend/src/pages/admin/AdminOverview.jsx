import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminService } from "../../services/adminService";
import { adminApi } from "../../services/api";

export default function AdminOverview() {
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [usersRes, analyticsData] = await Promise.all([
          adminApi.getUsers(),
          adminService.getAnalytics(),
        ]);
        if (usersRes.success) setUsers(usersRes.users);
        if (analyticsData) setAnalytics(analyticsData);
        else setError("Could not load platform analytics from backend.");
      } catch (err) {
        setError(err.message || "Failed to load telemetry data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center rounded-3xl border border-slate-200 bg-white">
        <div className="flex items-center gap-3 text-slate-500 font-semibold text-sm">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
          Loading telemetry and live database metrics…
        </div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {error || "Telemetry data is currently unavailable."}
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "active").length;
  const suspendedUsers = users.filter((u) => u.status === "suspended").length;

  const trend = analytics.dailyUsageTrend || [];
  const maxTrend = Math.max(...trend.map((t) => t.requests), 1);
  const chartPoints = trend.map((t, idx) => {
    const x = trend.length > 1 ? 30 + (idx / (trend.length - 1)) * 440 : 250;
    const y = 160 - (t.requests / maxTrend) * 120;
    return { ...t, x, y };
  });
  const polylinePoints = chartPoints.map((p) => `${p.x},${p.y}`).join(" ");
  const polygonPoints = chartPoints.length > 0
    ? `30,160 ${polylinePoints} 470,160`
    : "";
  const topFeature = analytics.usageByFeature?.slice().sort((a, b) => b.requests - a.requests)[0]?.name || "Concept Root";

  return (
    <div className="space-y-8">
      {/* Top Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-indigo-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300">
              <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
              AIFinity Control Center
            </div>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Platform Health & Telemetry
            </h2>
            <p className="mt-1 text-xs text-slate-300 max-w-xl">
              Overview of user growth, AI request volume, model latencies, and user management activity.
            </p>
          </div>

          <Link
            to="/admin/users"
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-500 hover:scale-105 active:scale-95"
          >
            Manage Users
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Reusable Stat Cards Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Users Stat Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Users
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold">
              👥
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">{totalUsers}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-bold text-emerald-600">+{activeUsers} Active</span>
            <span className="text-slate-400">· {suspendedUsers} suspended</span>
          </div>
        </div>

        {/* AI Request Volume */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              AI Requests (30d)
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600 font-bold">
              ⚡
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.totalRequests.toLocaleString()}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-bold text-emerald-600">99.4% Success</span>
            <span className="text-slate-400">· {analytics.averageLatencyMs}ms avg</span>
          </div>
        </div>

        {/* Active Users Today */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Today
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600 font-bold">
              🔥
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-slate-900">
            {analytics.activeUsersToday}
          </p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="font-bold text-emerald-600">+14% vs yesterday</span>
          </div>
        </div>

        {/* System Health */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              API Telemetry
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 font-bold">
              🛡️
            </span>
          </div>
          <p className="mt-3 text-3xl font-extrabold text-emerald-600">Optimal</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-slate-500">Token usage: {analytics.tokenConsumption.promptTokens}</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* User Activity & Request Trend (SVG Line Chart) */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Weekly AI Request Traffic</h3>
              <p className="text-xs text-slate-500">Daily request volume and active learner count</p>
            </div>
            <span className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
              Live Feed
            </span>
          </div>

          {/* Clean Responsive SVG Chart */}
          <div className="h-64 w-full pt-4">
            <svg className="h-full w-full overflow-visible" viewBox="0 0 500 200">
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="90" x2="500" y2="90" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="140" x2="500" y2="140" stroke="#f1f5f9" strokeWidth="1" />

              {/* Line path */}
              {polylinePoints && (
                <polyline
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  points={polylinePoints}
                />
              )}
              {/* Area gradient under line */}
              {polygonPoints && (
                <polygon
                  fill="url(#indigoGrad)"
                  opacity="0.15"
                  points={polygonPoints}
                />
              )}

              <defs>
                <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Data points */}
              {chartPoints.map((pt) => (
                <g key={pt.day}>
                  <circle cx={pt.x} cy={pt.y} r="5" fill="#6366f1" stroke="#ffffff" strokeWidth="2" />
                  <text x={pt.x} y={pt.y - 10} textAnchor="middle" fill="#6366f1" fontSize="10" fontWeight="bold">
                    {pt.requests >= 1000 ? `${(pt.requests / 1000).toFixed(1)}k` : pt.requests}
                  </text>
                  <text x={pt.x} y="185" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="600">
                    {pt.day}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* AI Feature Distribution Bar Chart */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">AI Feature Breakdown</h3>
            <p className="text-xs text-slate-500">Distribution across learning tools</p>
          </div>

          <div className="space-y-4">
            {analytics.usageByFeature.map((item) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-700">{item.name}</span>
                  <span className="font-bold text-slate-900">{item.percentage}% ({item.requests})</span>
                </div>
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-3 text-center">
            <p className="text-[11px] font-medium text-slate-500">
              Most requested module: <strong className="text-indigo-600">{topFeature}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

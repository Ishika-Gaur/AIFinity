import { useState, useEffect, useMemo } from "react";
import { adminApi } from "../../services/api";

const STATUS_OPTIONS = ["pending", "reviewing", "completed", "rejected"];

export default function CourseRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Selected request for details modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [newStatus, setNewStatus] = useState("");

  const loadRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getCourseRequests({ status: statusFilter });
      if (res && res.success) {
        setRequests(res.requests || []);
      } else {
        setError(res.error || "Failed to load course requests from the database.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while loading course requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [statusFilter]);

  const displayedRequests = useMemo(() => {
    if (!search.trim()) return requests;
    const term = search.trim().toLowerCase();
    return requests.filter(
      (r) =>
        r.courseName.toLowerCase().includes(term) ||
        r.userName.toLowerCase().includes(term) ||
        r.userEmail.toLowerCase().includes(term) ||
        (r.provider && r.provider.toLowerCase().includes(term))
    );
  }, [requests, search]);

  const handleOpenDetails = (request) => {
    setSelectedRequest(request);
    setNewStatus(request.status);
    setSuccessMsg("");
  };

  const handleCloseDetails = () => {
    setSelectedRequest(null);
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!selectedRequest || updatingStatus) return;

    setUpdatingStatus(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await adminApi.updateCourseRequestStatus(selectedRequest.id, newStatus);
      if (res && res.success) {
        setSuccessMsg(`Status updated to "${newStatus}".`);
        // Update local state in table
        setRequests((prev) =>
          prev.map((item) => (item.id === selectedRequest.id ? res.request : item))
        );
        setSelectedRequest(res.request);
      } else {
        setError(res.error || "Failed to update course request status.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while updating status.");
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "bg-amber-100 text-amber-800 border-amber-300";
      case "reviewing":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "completed":
        return "bg-emerald-100 text-emerald-800 border-emerald-300";
      case "rejected":
        return "bg-rose-100 text-rose-800 border-rose-300";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Course Requests
          </h2>
          <p className="mt-1 text-xs text-slate-500">
            Review and manage learner-submitted course requests stored in MongoDB.
          </p>
        </div>
        <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-xs">
          Total Requests: {requests.length}
        </span>
      </div>

      {/* Alerts */}
      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 shadow-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError("")} className="text-rose-500 hover:text-rose-800">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by course, learner, or email..."
          className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
        />

        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Status:
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="reviewing">Reviewing</option>
            <option value="completed">Completed</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3.5">Course</th>
                <th className="px-6 py-3.5">Requested By</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-600 border-t-transparent" />
                      Loading course requests from database…
                    </span>
                  </td>
                </tr>
              ) : displayedRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No course requests found.
                  </td>
                </tr>
              ) : (
                displayedRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">
                        {req.courseName}
                      </div>
                      {req.provider && (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Provider: {req.provider}
                        </div>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">
                        {req.userName}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {req.userEmail}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider capitalize ${getStatusBadge(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleOpenDetails(req)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REQUEST DETAILS MODAL (Requirement 8) */}
      {selectedRequest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in"
          onClick={(e) => {
            if (e.target === e.currentTarget && !updatingStatus) handleCloseDetails();
          }}
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-2xl">
            {/* Close button */}
            <button
              onClick={handleCloseDetails}
              disabled={updatingStatus}
              className="absolute right-5 top-5 h-8 w-8 rounded-full border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>

            {/* Header */}
            <div className="border-b border-slate-100 pb-4 mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                COURSE REQUEST DETAILS
              </span>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {selectedRequest.courseName}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Submitted on {new Date(selectedRequest.createdAt).toLocaleString()}
              </p>
            </div>

            {/* Success message inside modal */}
            {successMsg && (
              <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">
                ✓ {successMsg}
              </div>
            )}

            {/* Complete Details Grid */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Requested By
                  </span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">
                    {selectedRequest.userName}
                  </p>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    User Email
                  </span>
                  <p className="text-sm font-semibold text-slate-700 mt-0.5">
                    {selectedRequest.userEmail}
                  </p>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Provider / Instructor
                  </span>
                  <p className="text-slate-800 mt-0.5 font-medium">
                    {selectedRequest.provider || "Not specified"}
                  </p>
                </div>
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Reference URL
                  </span>
                  <p className="mt-0.5 truncate">
                    {selectedRequest.referenceUrl ? (
                      <a
                        href={selectedRequest.referenceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:underline font-semibold"
                      >
                        {selectedRequest.referenceUrl} ↗
                      </a>
                    ) : (
                      <span className="text-slate-400">None provided</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div>
                <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  Why do you want this course?
                </span>
                <div className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {selectedRequest.reason}
                </div>
              </div>

              {/* Additional Details */}
              {selectedRequest.additionalDetails && (
                <div>
                  <span className="font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                    Additional Details
                  </span>
                  <div className="mt-1 p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                    {selectedRequest.additionalDetails}
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              <form onSubmit={handleUpdateStatus} className="pt-4 border-t border-slate-100">
                <label className="block font-bold uppercase tracking-wider text-slate-500 text-[11px] mb-2">
                  Change Request Status
                </label>
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full sm:w-56 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-bold text-slate-800 outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    {STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st} className="capitalize">
                        {st.charAt(0).toUpperCase() + st.slice(1)}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    disabled={updatingStatus || newStatus === selectedRequest.status}
                    className="w-full sm:w-auto rounded-xl bg-indigo-600 hover:bg-indigo-700 px-5 py-2.5 text-xs font-bold text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {updatingStatus ? "Updating…" : "Update Status"}
                  </button>
                </div>
              </form>
            </div>

            {/* Modal Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={handleCloseDetails}
                disabled={updatingStatus}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

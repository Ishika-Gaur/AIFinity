import mongoose from "mongoose";
import CourseRequest from "../models/CourseRequest.js";
import { sendCourseRequestAdminNotification } from "../services/emailService.js";

// Duplicate protection window: 15 minutes
const DUPLICATE_COOLDOWN_MS = 15 * 60 * 1000;

/**
 * Validates whether a string is a valid HTTP/HTTPS URL.
 */
function isValidUrl(urlString) {
  if (!urlString) return true;
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalizes course name for duplicate checking (trims, collapses multiple spaces, lowercases).
 */
function normalizeCourseName(name) {
  return (name || "").trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Formats a CourseRequest document for API responses.
 */
function formatCourseRequest(doc, fallbackUser = null) {
  const safeFallback = fallbackUser && typeof fallbackUser === "object" ? fallbackUser : null;
  const user = doc.userId && typeof doc.userId === "object" && doc.userId.name ? doc.userId : safeFallback;
  const docId = doc._id ? doc._id.toString() : (doc.id ? doc.id.toString() : "");
  return {
    id: docId,
    _id: docId,
    userId: user ? (user._id || user.id) : doc.userId,
    userName: user ? user.name : "Learner",
    userEmail: user ? user.email : "",
    courseName: doc.courseName,
    provider: doc.provider || "",
    referenceUrl: doc.referenceUrl || "",
    reason: doc.reason,
    additionalDetails: doc.additionalDetails || "",
    status: doc.status,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

/**
 * POST /api/course-requests
 * Authenticated endpoint to submit a new course request.
 */
export async function createCourseRequest(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "You must be signed in to submit a course request.",
      });
    }

    const {
      courseName,
      provider,
      referenceUrl,
      reason,
      additionalDetails,
    } = req.body;

    // 1. Validation
    const trimmedCourseName = (courseName || "").trim();
    const trimmedReason = (reason || "").trim();
    const trimmedProvider = (provider || "").trim();
    const trimmedRefUrl = (referenceUrl || "").trim();
    const trimmedDetails = (additionalDetails || "").trim();

    if (!trimmedCourseName) {
      return res.status(400).json({
        success: false,
        message: "Course name is required.",
      });
    }

    if (trimmedCourseName.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Course name must be at least 2 characters long.",
      });
    }

    if (trimmedCourseName.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Course name cannot exceed 200 characters.",
      });
    }

    if (!trimmedReason) {
      return res.status(400).json({
        success: false,
        message: "Please tell us why you want this course.",
      });
    }

    if (trimmedReason.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Reason must be at least 5 characters long.",
      });
    }

    if (trimmedReason.length > 3000) {
      return res.status(400).json({
        success: false,
        message: "Reason cannot exceed 3000 characters.",
      });
    }

    if (trimmedRefUrl && !isValidUrl(trimmedRefUrl)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid URL starting with http:// or https://.",
      });
    }

    // 2. Duplicate Request Protection:
    // Check if the same authenticated user submitted a request for the exact same course name
    // within the duplicate cooldown window (15 minutes), or has an active pending request with the same name.
    const normalizedTarget = normalizeCourseName(trimmedCourseName);
    const recentCutoff = new Date(Date.now() - DUPLICATE_COOLDOWN_MS);

    const existingRecent = await CourseRequest.findOne({
      userId: req.user._id,
      createdAt: { $gte: recentCutoff },
    }).sort({ createdAt: -1 });

    if (existingRecent && normalizeCourseName(existingRecent.courseName) === normalizedTarget) {
      return res.status(409).json({
        success: false,
        message: `You recently submitted a request for "${existingRecent.courseName}". Our team is already reviewing it!`,
        request: formatCourseRequest(existingRecent),
      });
    }

    // 3. Create Record in MongoDB
    const newRequest = await CourseRequest.create({
      userId: req.user._id,
      courseName: trimmedCourseName,
      provider: trimmedProvider,
      referenceUrl: trimmedRefUrl,
      reason: trimmedReason,
      additionalDetails: trimmedDetails,
      status: "pending",
    });

    // 4. Send Email Notification Asynchronously (Non-blocking)
    // The request creation succeeds even if email delivery encounters an issue.
    sendCourseRequestAdminNotification({
      courseRequest: newRequest,
      user: req.user,
    }).catch((emailErr) => {
      console.error("[CourseRequest] Asynchronous email notification error:", emailErr);
    });

    return res.status(201).json({
      success: true,
      message: "Course request submitted successfully.",
      request: formatCourseRequest(newRequest, req.user),
    });
  } catch (err) {
    console.error("[CourseRequest] Error creating course request:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to submit course request. Please try again later.",
      error: err.message,
    });
  }
}

/**
 * GET /api/course-requests/my
 * Authenticated user endpoint to view their own submitted requests.
 */
export async function getMyCourseRequests(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Not authenticated." });
    }

    const requests = await CourseRequest.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      requests: requests.map((doc) => formatCourseRequest({ ...doc, userId: req.user })),
    });
  } catch (err) {
    console.error("[CourseRequest] Error fetching user requests:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve your course requests.",
      error: err.message,
    });
  }
}

/**
 * GET /api/admin/course-requests or GET /api/course-requests
 * Admin endpoint to list all course requests with filters, search, and pagination.
 */
export async function listCourseRequests(req, res) {
  try {
    const { status, search } = req.query;
    const query = {};

    if (status && status !== "all" && status !== "All") {
      const validStatuses = ["pending", "reviewing", "completed", "rejected"];
      if (validStatuses.includes(status.toLowerCase())) {
        query.status = status.toLowerCase();
      }
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { courseName: searchRegex },
        { provider: searchRegex },
        { reason: searchRegex },
      ];
    }

    const requests = await CourseRequest.find(query)
      .populate("userId", "name email role")
      .sort({ createdAt: -1 })
      .lean();

    // In-memory filter for user name/email if search was supplied
    let results = requests.map((doc) => formatCourseRequest(doc));
    if (search && search.trim()) {
      const term = search.trim().toLowerCase();
      results = results.filter(
        (r) =>
          r.courseName.toLowerCase().includes(term) ||
          r.provider.toLowerCase().includes(term) ||
          r.userName.toLowerCase().includes(term) ||
          r.userEmail.toLowerCase().includes(term) ||
          r.reason.toLowerCase().includes(term)
      );
    }

    return res.status(200).json({
      success: true,
      total: results.length,
      requests: results,
    });
  } catch (err) {
    console.error("[CourseRequest] Error listing requests for admin:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to load course requests.",
      error: err.message,
    });
  }
}

/**
 * GET /api/admin/course-requests/:id
 * Admin endpoint to fetch complete details of a single request.
 */
export async function getCourseRequestById(req, res) {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course request ID format.",
      });
    }

    const request = await CourseRequest.findById(id).populate("userId", "name email role status");
    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Course request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      request: formatCourseRequest(request),
    });
  } catch (err) {
    console.error("[CourseRequest] Error fetching request details:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch course request details.",
      error: err.message,
    });
  }
}

/**
 * PATCH /api/admin/course-requests/:id/status
 * Admin endpoint to update the status of a course request.
 */
export async function updateCourseRequestStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course request ID format.",
      });
    }

    const validStatuses = ["pending", "reviewing", "completed", "rejected"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    const updated = await CourseRequest.findByIdAndUpdate(
      id,
      { status: status.toLowerCase() },
      { new: true, runValidators: true }
    ).populate("userId", "name email");

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: "Course request not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `Course request marked as ${status.toLowerCase()}.`,
      request: formatCourseRequest(updated),
    });
  } catch (err) {
    console.error("[CourseRequest] Error updating status:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to update course request status.",
      error: err.message,
    });
  }
}

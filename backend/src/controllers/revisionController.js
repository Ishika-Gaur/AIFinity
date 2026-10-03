import { getRevisionDashboardData, getRevisionSession, completeRevisionSession } from "../services/revisionService.js";

/**
 * GET /api/revision
 * Gets the revision dashboard data: concepts to revise, priorities, stats.
 */
export async function getRevisionDashboard(req, res) {
  try {
    const data = await getRevisionDashboardData(req.user._id);
    return res.json({ success: true, data });
  } catch (err) {
    console.error("[Revision] Error fetching dashboard data:", err);
    return res.status(500).json({ success: false, message: "Unable to load Revision dashboard." });
  }
}

/**
 * GET /api/revision/:conceptId
 * Starts or resumes a revision session for a concept.
 */
export async function startRevisionSession(req, res) {
  try {
    const { conceptId } = req.params;
    if (!conceptId) return res.status(400).json({ success: false, message: "Concept ID is required." });

    const sessionData = await getRevisionSession(req.user._id, conceptId);
    return res.json({ success: true, data: sessionData });
  } catch (err) {
    console.error(`[Revision] Error starting session for ${req.params.conceptId}:`, err);
    return res.status(500).json({ success: false, message: "Unable to load revision session." });
  }
}

/**
 * POST /api/revision/:conceptId/complete
 * Completes the revision session and updates spaced repetition schedule.
 */
export async function completeRevision(req, res) {
  try {
    const { conceptId } = req.params;
    const { practiceAccuracy, confidence } = req.body;

    if (practiceAccuracy === undefined || confidence === undefined) {
      return res.status(400).json({ success: false, message: "Practice accuracy and confidence are required." });
    }

    const result = await completeRevisionSession(req.user._id, conceptId, { practiceAccuracy, confidence });
    return res.json({ success: true, data: result });
  } catch (err) {
    console.error(`[Revision] Error completing session for ${req.params.conceptId}:`, err);
    return res.status(500).json({ success: false, message: "Unable to complete revision session." });
  }
}

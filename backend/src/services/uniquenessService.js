import AttemptResult from "../models/AttemptResult.js";

/**
 * Normalizes question text for robust structural comparison
 */
export function normalizeQuestionText(text) {
  if (!text || typeof text !== "string") return "";
  return text
    .toLowerCase()
    .replace(/[^\w\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const QUESTION_STOP_WORDS = new Set([
  "what", "which", "when", "where", "who", "whom", "whose", "why", "how",
  "that", "this", "these", "those", "from", "with", "have", "were", "been",
  "does", "will", "would", "should", "could", "about", "into", "through",
  "during", "before", "after", "above", "below", "between", "under", "again",
  "further", "then", "once", "here", "there", "their", "your", "they"
]);

/**
 * Calculates token-level similarity between two questions using stop-word filtering
 * and combined Jaccard / containment overlap metrics.
 */
export function calculateTokenSimilarity(text1, text2) {
  const norm1 = normalizeQuestionText(text1);
  const norm2 = normalizeQuestionText(text2);

  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0.0;

  // Substring inclusion check for substantive questions
  if (norm1.length > 30 && norm2.length > 30) {
    if (norm1.includes(norm2) || norm2.includes(norm1)) {
      return 0.95;
    }
  }

  const words1 = new Set(
    norm1
      .split(" ")
      .filter((w) => w.length > 2 && !QUESTION_STOP_WORDS.has(w))
  );
  const words2 = new Set(
    norm2
      .split(" ")
      .filter((w) => w.length > 2 && !QUESTION_STOP_WORDS.has(w))
  );

  if (words1.size === 0 || words2.size === 0) return 0.0;

  let intersection = 0;
  for (const w of words1) {
    if (words2.has(w)) intersection++;
  }

  const union = new Set([...words1, ...words2]).size;
  const jaccard = union > 0 ? intersection / union : 0.0;
  const containment = intersection / Math.min(words1.size, words2.size);

  // Return the higher of Jaccard or weighted containment
  return Math.max(jaccard, containment * 0.85);
}

/**
 * Checks if a candidate question semantically or structurally matches any encountered question
 */
export function isQuestionDuplicate(candidateText, encounteredQuestions = []) {
  if (!candidateText || !Array.isArray(encounteredQuestions) || encounteredQuestions.length === 0) return false;

  for (const prev of encounteredQuestions) {
    const similarity = calculateTokenSimilarity(candidateText, prev);
    if (similarity >= 0.55) {
      return true;
    }
  }

  return false;
}

/**
 * Queries AttemptResult collection for all questions a student has previously encountered
 */
export async function getUserEncounteredQuestions(userId) {
  if (!userId) return [];

  try {
    const attempts = await AttemptResult.find({ userId })
      .select("questionResults.questionText questionResults.questionId")
      .lean();

    const seen = new Set();
    const result = [];

    for (const att of attempts) {
      if (Array.isArray(att.questionResults)) {
        for (const qr of att.questionResults) {
          const qText = qr.questionText?.trim();
          if (qText && !seen.has(qText)) {
            seen.add(qText);
            result.push(qText);
          }
        }
      }
    }

    return result;
  } catch (err) {
    console.error("[UniquenessService] Failed to fetch encountered questions:", err.message);
    return [];
  }
}

/**
 * Filters a list of candidate questions to guarantee cross-course uniqueness
 */
export function filterUniqueQuestions(candidateQuestions = [], encounteredQuestions = []) {
  if (!Array.isArray(candidateQuestions)) return [];
  if (encounteredQuestions.length === 0) return candidateQuestions;

  const unique = [];
  const sessionSeen = [];

  for (const q of candidateQuestions) {
    const qText = q.question || q.questionText || "";
    // Must be unique against past cross-course questions AND unique within this session
    if (!isQuestionDuplicate(qText, encounteredQuestions) && !isQuestionDuplicate(qText, sessionSeen)) {
      unique.push(q);
      sessionSeen.push(qText);
    } else {
      console.info(`[UniquenessService] Filtered out cross-course duplicate question: "${qText.substring(0, 60)}..."`);
    }
  }

  return unique;
}

/**
 * Centralized Canonical Knowledge Service
 * Provides deterministic mapping of canonical concepts, skills, and prerequisite roots.
 */

const CANONICAL_KNOWLEDGE_GRAPH = {
  // Data Structures and Algorithms
  "dsa.binary-search": {
    name: "Binary Search",
    domain: "DSA",
    skillIds: ["dsa.searching"],
    candidateRootIds: [
      "dsa.sorted-data",
      "dsa.search-space",
      "dsa.binary-search.boundary-invariant",
      "dsa.index-reasoning"
    ]
  },
  "dsa.sorted-data": {
    name: "Sorted Data Structure",
    domain: "DSA",
    skillIds: ["dsa.arrays"],
    candidateRootIds: []
  },
  "dsa.search-space": {
    name: "Search Space Reduction",
    domain: "DSA",
    skillIds: ["dsa.searching", "dsa.algorithm-design"],
    candidateRootIds: ["dsa.divide-and-conquer"]
  },
  "dsa.binary-search.boundary-invariant": {
    name: "Boundary Invariant Reasoning",
    domain: "DSA",
    skillIds: ["dsa.searching", "dsa.invariants"],
    candidateRootIds: ["dsa.index-reasoning"]
  },
  "dsa.index-reasoning": {
    name: "Array Index Reasoning",
    domain: "DSA",
    skillIds: ["dsa.arrays"],
    candidateRootIds: []
  },

  // JavaScript
  "javascript.promises": {
    name: "Promises",
    domain: "JavaScript",
    skillIds: ["javascript.async"],
    candidateRootIds: [
      "javascript.callbacks",
      "javascript.event-loop",
      "javascript.microtasks",
      "javascript.execution-context"
    ]
  },
  "javascript.callbacks": {
    name: "Callbacks",
    domain: "JavaScript",
    skillIds: ["javascript.async", "javascript.functions"],
    candidateRootIds: ["javascript.higher-order-functions"]
  },
  "javascript.event-loop": {
    name: "Event Loop",
    domain: "JavaScript",
    skillIds: ["javascript.async", "javascript.architecture"],
    candidateRootIds: ["javascript.call-stack", "javascript.task-queue"]
  },

  // Fallback Domain Examples
  "general.critical-thinking": {
    name: "Critical Thinking",
    domain: "General",
    skillIds: ["general.reasoning"],
    candidateRootIds: ["general.logical-deduction", "general.reading-comprehension"]
  }
};

/**
 * Retrieves the full metadata for a given canonical concept ID.
 * @param {string} conceptId 
 * @returns {object|null}
 */
export function getConceptMetadata(conceptId) {
  return CANONICAL_KNOWLEDGE_GRAPH[conceptId] || null;
}

/**
 * Validates if a concept ID exists in the canonical graph.
 * @param {string} conceptId 
 * @returns {boolean}
 */
export function isValidConcept(conceptId) {
  return !!CANONICAL_KNOWLEDGE_GRAPH[conceptId];
}

/**
 * Retrieves candidate root concepts (prerequisites) for a target concept.
 * @param {string} targetConceptId 
 * @returns {Array<{id: string, name: string}>}
 */
export function getCandidateRoots(targetConceptId) {
  const metadata = getConceptMetadata(targetConceptId);
  if (!metadata || !metadata.candidateRootIds) return [];

  return metadata.candidateRootIds.map(id => {
    const rootMeta = getConceptMetadata(id);
    return {
      id,
      name: rootMeta ? rootMeta.name : id
    };
  });
}

/**
 * Validates if an errorType matches the controlled taxonomy.
 * @param {string} errorType 
 * @returns {boolean}
 */
export function isValidErrorType(errorType) {
  const ALLOWED_ERRORS = new Set([
    "incorrect_fact",
    "misapplied_rule",
    "boundary_error",
    "invariant_violation",
    "state_representation_error",
    "pattern_recognition_failure",
    "terminology_confusion",
    "calculation_error",
    "incomplete_reasoning",
    "concept_misunderstanding",
    "unanswered",
    "unknown"
  ]);
  return ALLOWED_ERRORS.has(errorType);
}

/**
 * Validates if a diagnosis status matches the controlled taxonomy.
 * @param {string} status 
 * @returns {boolean}
 */
export function isValidStatus(status) {
  return status === "diagnosed" || status === "insufficient_evidence";
}

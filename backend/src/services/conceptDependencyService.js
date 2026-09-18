/**
 * Concept Dependency Graph
 * Phase 3 Implementation
 * 
 * Provides a lightweight, extensible mapping of concepts to their prerequisites.
 */

// Format: { [conceptId]: [prerequisiteConceptId1, prerequisiteConceptId2] }
// Lower index = more direct prerequisite.
const DEPENDENCY_GRAPH = {
  // DSA - Binary Search
  "binary-search-on-answer": ["monotonicity", "search-space", "binary-search"],
  "monotonicity": ["functions", "ordering"],
  "search-space": ["arrays", "bounds"],
  "binary-search": ["arrays", "divide-and-conquer"],

  // Programming - Java/OOP
  "java-polymorphism": ["inheritance", "oop", "java-classes"],
  "inheritance": ["oop", "java-classes"],
  "oop": ["functions", "data-structures"],

  // Web - React
  "react-hooks": ["react-state", "javascript-closures", "js-scopes"],
  "react-state": ["react-components", "javascript-variables"],
  "react-components": ["html", "javascript-functions"],
  
  // JavaScript
  "javascript-closures": ["js-scopes", "javascript-functions"],
  "js-scopes": ["javascript-variables"],
  "javascript-async": ["event-loop", "callbacks", "promises"],
  "promises": ["callbacks"],

  // DB - SQL
  "sql-joins": ["sql-select", "relational-algebra"],
  "sql-group-by": ["sql-select", "aggregate-functions"],
};

// Maps an ID to a human-readable display name.
const CONCEPT_NAMES = {
  "binary-search-on-answer": "Binary Search on Answer",
  "monotonicity": "Monotonicity",
  "search-space": "Search Space",
  "binary-search": "Binary Search",
  "functions": "Functions",
  "ordering": "Ordering",
  "arrays": "Arrays",
  "bounds": "Bounds",
  "divide-and-conquer": "Divide and Conquer",
  "java-polymorphism": "Polymorphism (Java)",
  "inheritance": "Inheritance",
  "oop": "Object-Oriented Programming",
  "java-classes": "Java Classes",
  "data-structures": "Data Structures",
  "react-hooks": "React Hooks",
  "react-state": "React State",
  "javascript-closures": "Closures (JS)",
  "js-scopes": "Scopes (JS)",
  "react-components": "React Components",
  "javascript-variables": "Variables (JS)",
  "javascript-functions": "Functions (JS)",
  "html": "HTML Fundamentals",
  "javascript-async": "Asynchronous JS",
  "event-loop": "Event Loop",
  "callbacks": "Callbacks",
  "promises": "Promises",
  "sql-joins": "SQL Joins",
  "sql-select": "SQL Select",
  "relational-algebra": "Relational Algebra",
  "sql-group-by": "SQL Group By",
  "aggregate-functions": "Aggregate Functions",
};

/**
 * Returns immediate prerequisites for a given concept.
 */
export function getPrerequisites(conceptId) {
  return DEPENDENCY_GRAPH[conceptId] || [];
}

/**
 * Resolves the full path from an observed concept to a specific root prerequisite.
 * E.g., path from "binary-search-on-answer" to "functions"
 */
export function getConceptPath(observedConceptId, rootConceptId) {
  const queue = [[observedConceptId]];
  const visited = new Set([observedConceptId]);

  while (queue.length > 0) {
    const path = queue.shift();
    const current = path[path.length - 1];

    if (current === rootConceptId) {
      return path;
    }

    const prereqs = getPrerequisites(current);
    for (const p of prereqs) {
      if (!visited.has(p)) {
        visited.add(p);
        queue.push([...path, p]);
      }
    }
  }

  // If no path found but we know they are related (e.g. fallback), just return start -> end
  return [observedConceptId, rootConceptId];
}

/**
 * Gets human readable name
 */
export function getConceptName(conceptId) {
  return CONCEPT_NAMES[conceptId] || conceptId;
}

/**
 * Find all prerequisites (recursive) for a concept.
 */
export function getAllPrerequisites(conceptId) {
  const all = new Set();
  const queue = [conceptId];
  
  while(queue.length > 0) {
    const current = queue.shift();
    const prereqs = getPrerequisites(current);
    for(const p of prereqs) {
      if(!all.has(p)) {
        all.add(p);
        queue.push(p);
      }
    }
  }
  
  return Array.from(all);
}

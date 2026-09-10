/**
 * dependencyService.js
 * Builds a dependency graph for roadmap skills and performs topological sorting
 * to ensure prerequisites are always learned before advanced skills.
 */

export const orderSkillsByDependency = (prioritizedSkills) => {
  const graph = new Map();
  const inDegree = new Map();
  const skillMap = new Map();

  // Initialize
  prioritizedSkills.forEach(skill => {
    graph.set(skill.id, []);
    inDegree.set(skill.id, 0);
    skillMap.set(skill.id, skill);
  });

  // Build Graph
  prioritizedSkills.forEach(skill => {
    (skill.prerequisites || []).forEach(prereqId => {
      // Only consider prerequisites that are actually in this skill list
      if (graph.has(prereqId)) {
        graph.get(prereqId).push(skill.id);
        inDegree.set(skill.id, inDegree.get(skill.id) + 1);
      }
    });
  });

  // Topological Sort (Kahn's Algorithm)
  const queue = [];
  const sortedSkills = [];

  // Enqueue nodes with 0 in-degree
  for (const [id, degree] of inDegree.entries()) {
    if (degree === 0) {
      queue.push(id);
    }
  }

  while (queue.length > 0) {
    // Sort queue by priority score (descending) to resolve ties
    queue.sort((a, b) => skillMap.get(b).priorityScore - skillMap.get(a).priorityScore);
    
    const currentId = queue.shift();
    sortedSkills.push(skillMap.get(currentId));

    for (const neighborId of graph.get(currentId)) {
      inDegree.set(neighborId, inDegree.get(neighborId) - 1);
      if (inDegree.get(neighborId) === 0) {
        queue.push(neighborId);
      }
    }
  }

  // Check for circular dependencies
  if (sortedSkills.length !== prioritizedSkills.length) {
    console.error("[DependencyService] Circular dependency detected in skills. Falling back to original order.");
    // Fallback: Return original skills, sorting by priority score descending as best effort
    return [...prioritizedSkills].sort((a, b) => b.priorityScore - a.priorityScore);
  }

  return sortedSkills;
};

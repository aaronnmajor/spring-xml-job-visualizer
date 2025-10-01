class DAGGenerator {
  constructor() {
    this.nodes = new Map();
    this.edges = [];
  }

  generateDAG(jobs) {
    this.nodes.clear();
    this.edges = [];

    // Create nodes
    jobs.forEach(job => {
      this.nodes.set(job.id, {
        id: job.id,
        name: job.name,
        type: job.type,
        class: job.class,
        properties: job.properties
      });
    });

    // Create edges based on dependencies
    jobs.forEach(job => {
      job.dependencies.forEach(depId => {
        if (this.nodes.has(depId)) {
          this.edges.push({
            from: depId,
            to: job.id
          });
        }
      });
    });

    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges
    };
  }

  detectCycles() {
    const visited = new Set();
    const recursionStack = new Set();
    const cycles = [];

    const hasCycle = (nodeId, path = []) => {
      if (recursionStack.has(nodeId)) {
        cycles.push([...path, nodeId]);
        return true;
      }
      if (visited.has(nodeId)) {
        return false;
      }

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      const outgoingEdges = this.edges.filter(e => e.from === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycle(edge.to, [...path])) {
          return true;
        }
      }

      recursionStack.delete(nodeId);
      return false;
    };

    for (const nodeId of this.nodes.keys()) {
      if (!visited.has(nodeId)) {
        hasCycle(nodeId);
      }
    }

    return cycles;
  }

  getExecutionOrder() {
    const inDegree = new Map();
    const order = [];

    // Initialize in-degree
    this.nodes.forEach((_, id) => inDegree.set(id, 0));
    
    // Calculate in-degree
    this.edges.forEach(edge => {
      inDegree.set(edge.to, (inDegree.get(edge.to) || 0) + 1);
    });

    // Find nodes with no dependencies
    const queue = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });

    // Topological sort
    while (queue.length > 0) {
      const current = queue.shift();
      order.push(current);

      this.edges
        .filter(edge => edge.from === current)
        .forEach(edge => {
          const newDegree = inDegree.get(edge.to) - 1;
          inDegree.set(edge.to, newDegree);
          if (newDegree === 0) {
            queue.push(edge.to);
          }
        });
    }

    // If order doesn't include all nodes, there's a cycle
    if (order.length !== this.nodes.size) {
      return null; // Cycle detected
    }

    return order;
  }

  getLevels() {
    const levels = [];
    const nodeLevel = new Map();
    const visited = new Set();

    const calculateLevel = (nodeId, level = 0) => {
      if (visited.has(nodeId)) {
        return;
      }
      
      visited.add(nodeId);
      const currentLevel = nodeLevel.get(nodeId) || 0;
      nodeLevel.set(nodeId, Math.max(currentLevel, level));

      const outgoingEdges = this.edges.filter(e => e.from === nodeId);
      outgoingEdges.forEach(edge => {
        calculateLevel(edge.to, level + 1);
      });
    };

    // Start from root nodes (nodes with no incoming edges)
    const rootNodes = Array.from(this.nodes.keys()).filter(nodeId => {
      return !this.edges.some(e => e.to === nodeId);
    });

    if (rootNodes.length === 0 && this.nodes.size > 0) {
      // If no root nodes, start from any node (might indicate a cycle)
      rootNodes.push(this.nodes.keys().next().value);
    }

    rootNodes.forEach(nodeId => calculateLevel(nodeId));

    // Group nodes by level
    nodeLevel.forEach((level, nodeId) => {
      if (!levels[level]) {
        levels[level] = [];
      }
      levels[level].push(this.nodes.get(nodeId));
    });

    return levels.filter(level => level); // Remove empty levels
  }
}

module.exports = DAGGenerator;

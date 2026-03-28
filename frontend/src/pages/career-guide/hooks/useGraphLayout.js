import dagre from "@dagrejs/dagre";
import { useMemo } from "react";

function nodeSize(type) {
  switch (type) {
    case "nexus":  return { w: 200, h: 60 };
    case "stream": return { w: 165, h: 70 };
    case "domain": return { w: 155, h: 90 };
    default:       return { w: 150, h: 85 };
  }
}

export function useGraphLayout(graph, activeDomain) {
  return useMemo(() => {
    const visibleNodes = graph.nodes.filter((n) => {
      if (!activeDomain) return true;
      if (n.type === "nexus") return true;
      if (n.type === "stream") return n.domain === activeDomain;
      return n.domain === activeDomain;
    });

    const visibleIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = graph.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: "TB", nodesep: 36, ranksep: 70, marginx: 50, marginy: 50 });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    for (const node of visibleNodes) {
      const { w, h } = nodeSize(node.type);
      g.setNode(node.id, { width: w, height: h });
    }

    for (const edge of visibleEdges) {
      if (edge.type !== "impactEdge") g.setEdge(edge.source, edge.target);
    }

    dagre.layout(g);

    const connMap = new Map();
    for (const n of visibleNodes) connMap.set(n.id, []);
    for (const e of visibleEdges) {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        connMap.get(src.id)?.push(tgt.label);
        connMap.get(tgt.id)?.push(src.label);
      }
    }

    const nodes = visibleNodes.map((node) => {
      const dNode = g.node(node.id);
      const { w, h } = nodeSize(node.type);
      return {
        id: node.id,
        type: node.type === "nexus" ? "nexus" : "domain",
        position: { x: dNode.x - w / 2, y: dNode.y - h / 2 },
        data: {
          label: node.label,
          description: node.description,
          domain: node.domain,
          level: node.level,
          nodeKind: node.type,
          icon: node.icon,
          duration: node.duration,
          connectedLabels: connMap.get(node.id) ?? [],
        },
      };
    });

    const edges = visibleEdges.map((edge) => {
      const srcNode = nodeMap.get(edge.source);
      const tgtNode = nodeMap.get(edge.target);
      const domain = srcNode?.domain ?? tgtNode?.domain ?? "science";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: "impactEdge",
        animated: true,
        label: edge.label,
        data: {
          label: edge.label,
          description: edge.description,
          domain,
          sourceLabel: srcNode?.label ?? edge.source,
          targetLabel: tgtNode?.label ?? edge.target,
        },
      };
    });

    return { nodes, edges };
  }, [graph, activeDomain]);
}

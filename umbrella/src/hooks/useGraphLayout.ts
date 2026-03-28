import dagre from "@dagrejs/dagre";
import { useMemo } from "react";
import type {
  Domain,
  KnowledgeEdgeData,
  KnowledgeFlowEdge,
  KnowledgeFlowNode,
  KnowledgeGraphData,
  KnowledgeNodeData
} from "../types/knowledge";

// Node dimensions by type
function nodeSize(type?: string) {
  switch (type) {
    case "nexus":   return { w: 200, h: 60 };
    case "stream":  return { w: 165, h: 70 };
    case "domain":  return { w: 155, h: 90 };
    default:        return { w: 150, h: 85 };
  }
}

export function useGraphLayout(graph: KnowledgeGraphData, activeDomain?: Domain | null) {
  return useMemo(() => {
    // Filter nodes: always show root + hsc, plus selected domain's nodes
    const visibleNodes = graph.nodes.filter((n) => {
      if (!activeDomain) return true;
      if (n.type === "nexus") return true; // always show milestones
      if (n.type === "stream") return n.domain === activeDomain; // only selected stream header
      return n.domain === activeDomain;
    });

    const visibleIds = new Set(visibleNodes.map((n) => n.id));

    // Filter edges — only show edges where both endpoints are visible
    const visibleEdges = graph.edges.filter(
      (e) => visibleIds.has(e.source) && visibleIds.has(e.target)
    );

    const g = new dagre.graphlib.Graph();
    g.setGraph({
      rankdir: "TB",
      nodesep: 36,
      ranksep: 70,
      marginx: 50,
      marginy: 50
    });
    g.setDefaultEdgeLabel(() => ({}));

    const nodeMap = new Map(graph.nodes.map((n) => [n.id, n]));

    for (const node of visibleNodes) {
      const { w, h } = nodeSize(node.type);
      g.setNode(node.id, { width: w, height: h });
    }

    for (const edge of visibleEdges) {
      if (edge.type !== "impactEdge") {
        g.setEdge(edge.source, edge.target);
      }
    }

    dagre.layout(g);

    // Build connectedLabels
    const connMap = new Map<string, string[]>();
    for (const n of visibleNodes) connMap.set(n.id, []);
    for (const e of visibleEdges) {
      const src = nodeMap.get(e.source);
      const tgt = nodeMap.get(e.target);
      if (src && tgt) {
        connMap.get(src.id)?.push(tgt.label);
        connMap.get(tgt.id)?.push(src.label);
      }
    }

    const nodes: KnowledgeFlowNode[] = visibleNodes.map((node) => {
      const dNode = g.node(node.id);
      const { w, h } = nodeSize(node.type);
      const data: KnowledgeNodeData = {
        label: node.label,
        description: node.description,
        domain: node.domain,
        level: node.level,
        nodeKind: node.type,
        icon: node.icon,
        duration: node.duration,
        connectedLabels: connMap.get(node.id) ?? []
      };
      return {
        id: node.id,
        type: node.type === "nexus" ? "nexus" : "domain",
        position: { x: dNode.x - w / 2, y: dNode.y - h / 2 },
        data
      };
    });

    const edges: KnowledgeFlowEdge[] = visibleEdges.map((edge) => {
      const srcNode = nodeMap.get(edge.source);
      const tgtNode = nodeMap.get(edge.target);
      const domain = srcNode?.domain ?? tgtNode?.domain ?? "science";
      const data: KnowledgeEdgeData = {
        label: edge.label,
        description: edge.description,
        domain,
        sourceLabel: srcNode?.label ?? edge.source,
        targetLabel: tgtNode?.label ?? edge.target
      };
      const isImpact = edge.type === "impactEdge";
      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: isImpact ? "impactEdge" : "smoothstep",
        animated: isImpact,
        label: edge.label,
        data,
        style: isImpact
          ? undefined
          : { stroke: "rgba(148,163,184,0.22)", strokeWidth: 1.5 }
      };
    });

    return { nodes, edges };
  }, [graph, activeDomain]);
}

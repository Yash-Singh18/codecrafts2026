import type { Edge, Node } from "@xyflow/react";

export type Domain = "science" | "commerce" | "arts";
export type RoadmapLevel = "basics" | "core" | "strong";
export type NodeKind = "nexus" | "stream" | "domain" | "career";

export type KnowledgeNodeRecord = {
  id: string;
  label: string;
  type?: NodeKind;
  domain?: Domain;
  parentId?: string;
  level?: RoadmapLevel;
  description?: string;
  icon?: string;
  duration?: string;
};

export type KnowledgeEdgeRecord = {
  id: string;
  source: string;
  target: string;
  type?: "default" | "impactEdge";
  label?: string;
  description?: string;
};

export type KnowledgeGraphData = {
  nodes: KnowledgeNodeRecord[];
  edges: KnowledgeEdgeRecord[];
};

export type KnowledgeNodeData = {
  label: string;
  description?: string;
  domain?: Domain;
  level?: RoadmapLevel;
  nodeKind?: NodeKind;
  icon?: string;
  duration?: string;
  connectedLabels: string[];
};

export type KnowledgeEdgeData = {
  label?: string;
  description?: string;
  domain?: Domain;
  sourceLabel: string;
  targetLabel: string;
};

export type KnowledgeFlowNode = Node<KnowledgeNodeData>;
export type KnowledgeFlowEdge = Edge<KnowledgeEdgeData>;

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

export type SidebarSelection = {
  kind: "node" | "edge";
  id: string;
  label: string;
  domain: Domain | "nexus" | "stream";
  level?: RoadmapLevel;
  nodeKind?: NodeKind;
  description?: string;
  duration?: string;
  connectedLabels?: string[];
  sourceLabel?: string;
  targetLabel?: string;
};


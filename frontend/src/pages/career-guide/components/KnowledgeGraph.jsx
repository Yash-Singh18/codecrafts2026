import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BookOpen, RotateCcw } from "lucide-react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useGraphLayout } from "../hooks/useGraphLayout";
import { DOMAIN_META } from "../lib/domain";
import { ChatPanel } from "./ChatPanel";
import { ImpactEdge } from "./ImpactEdge";
import { DomainNode } from "./DomainNode";
import { NexusNode } from "./NexusNode";

const nodeTypes = { nexus: NexusNode, domain: DomainNode };
const edgeTypes = { impactEdge: ImpactEdge };

function GraphScene({ graph, generating, generationError, onGenerateGraph, onResetGraph }) {
  const { fitView } = useReactFlow();
  const [chatDomain, setChatDomain] = useState(null);
  const [chatPrompt, setChatPrompt] = useState(null);
  const { nodes, edges } = useGraphLayout(graph, null);

  const roadmapTitle = useMemo(() => {
    const nexus = graph.nodes.find((n) => n.type === "nexus");
    return nexus?.label ?? "Student Career Roadmap";
  }, [graph]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({ duration: 800, maxZoom: 1, padding: window.innerWidth < 1100 ? 0.22 : 0.15 });
    }, 180);
    return () => window.clearTimeout(timer);
  }, [fitView, graph, nodes.length]);

  function handleNodeClick(_event, node) {
    const label = node.data.label;
    const description = node.data.description ? `\n${node.data.description}` : "";
    const duration = node.data.duration ? ` (${node.data.duration})` : "";
    const connected = node.data.connectedLabels?.length
      ? `\nConnects to: ${node.data.connectedLabels.slice(0, 4).join(", ")}`
      : "";

    startTransition(() => {
      setChatDomain(node.data.domain ?? null);
      setChatPrompt(`Explain "${label}"${duration} in this student roadmap.${description}${connected}`);
    });
  }

  function handleEdgeClick(_event, edge) {
    const sourceLabel = edge.data?.sourceLabel ?? edge.source;
    const targetLabel = edge.data?.targetLabel ?? edge.target;

    startTransition(() => {
      setChatDomain(edge.data?.domain ?? null);
      setChatPrompt(`Explain the roadmap connection between "${sourceLabel}" and "${targetLabel}".`);
    });
  }

  return (
    <div className="cg-shell">
      <header className="cg-topbar">
        <div className="cg-topbar__brand">
          <div className="cg-topbar__logo">
            <BookOpen style={{ width: 15, height: 15, color: "white" }} />
          </div>
          <div>
            <div className="cg-topbar__name">{roadmapTitle}</div>
            <div className="cg-topbar__sub">
              Ask for medicine, commerce, finance, arts, law, technology, or any career field in the chat. The graph will expand into a detailed roadmap automatically.
            </div>
          </div>
        </div>
        <div className="cg-topbar__actions">
          <button className="cg-change-btn" onClick={onResetGraph}>
            <RotateCcw style={{ width: 14, height: 14 }} />
            Reset overview
          </button>
        </div>
      </header>

      <div className="cg-main">
        <section className="cg-graph-stage">
          <div className="cg-canvas-shell">
            <div className="cg-canvas-wrapper">
              <div className="cg-canvas-hint">
                Click any node for context, or type a topic in the right chat to generate a deeper roadmap.
              </div>

              {generating ? (
                <div className="cg-canvas-hint cg-canvas-hint--secondary">
                  Generating detailed roadmap...
                </div>
              ) : null}

              {generationError ? (
                <div className="cg-canvas-error">{generationError}</div>
              ) : null}

              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                fitView
                minZoom={0.12}
                maxZoom={2}
                elementsSelectable
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={28} size={1} color="rgba(255,255,255,0.05)" />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node) =>
                    node.type === "nexus" ? "#f0c040" : DOMAIN_META[node.data.domain ?? "science"].color
                  }
                  maskColor="rgba(13,17,23,0.7)"
                  style={{ background: "#161b22", border: "1px solid rgba(255,255,255,0.08)" }}
                />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </div>
        </section>

        <aside className="cg-chat-rail">
          <ChatPanel
            domain={chatDomain}
            initialPrompt={chatPrompt}
            generatingRoadmap={generating}
            onRoadmapRequest={onGenerateGraph}
            onClose={() => { setChatPrompt(null); setChatDomain(null); }}
          />
        </aside>
      </div>
    </div>
  );
}

export default function KnowledgeGraph(props) {
  return (
    <ReactFlowProvider>
      <GraphScene {...props} />
    </ReactFlowProvider>
  );
}

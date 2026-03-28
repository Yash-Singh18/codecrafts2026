import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { BookOpen, RotateCcw } from "lucide-react";
import {
  startTransition,
  useEffect,
  useMemo,
  useState,
  type MouseEvent as ReactMouseEvent
} from "react";
import { useGraphLayout } from "../hooks/useGraphLayout";
import { DOMAIN_META } from "../lib/domain";
import type {
  Domain,
  KnowledgeFlowEdge,
  KnowledgeFlowNode,
  KnowledgeGraphData
} from "../types/knowledge";
import { ChatPanel } from "./ChatPanel";
import { ImpactEdge } from "./edges/ImpactEdge";
import { DomainNode } from "./nodes/DomainNode";
import { NexusNode } from "./nodes/NexusNode";

type Props = {
  graph: KnowledgeGraphData;
  generating: boolean;
  generationError: string | null;
  onGenerateGraph: (prompt: string) => Promise<void>;
  onResetGraph: () => void;
};

const nodeTypes = { nexus: NexusNode, domain: DomainNode };
const edgeTypes = { impactEdge: ImpactEdge };

function GraphScene({
  graph,
  generating,
  generationError,
  onGenerateGraph,
  onResetGraph
}: Props) {
  const { fitView } = useReactFlow();
  const [chatDomain, setChatDomain] = useState<Domain | null>(null);
  const [chatPrompt, setChatPrompt] = useState<string | null>(null);
  const { nodes, edges } = useGraphLayout(graph, null);

  const roadmapTitle = useMemo(() => {
    const nexus = graph.nodes.find((node) => node.type === "nexus");
    return nexus?.label ?? "Student Career Roadmap";
  }, [graph]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      fitView({
        duration: 800,
        maxZoom: 1,
        padding: window.innerWidth < 1100 ? 0.22 : 0.15
      });
    }, 180);

    return () => window.clearTimeout(timer);
  }, [fitView, graph, nodes.length]);

  function handleNodeClick(_event: ReactMouseEvent, node: KnowledgeFlowNode) {
    const label = node.data.label;
    const description = node.data.description ? `\n${node.data.description}` : "";
    const duration = node.data.duration ? ` (${node.data.duration})` : "";
    const connected = node.data.connectedLabels?.length
      ? `\nConnects to: ${node.data.connectedLabels.slice(0, 4).join(", ")}`
      : "";

    startTransition(() => {
      setChatDomain(node.data.domain ?? null);
      setChatPrompt(
        `Explain "${label}"${duration} in this student roadmap.${description}${connected}`
      );
    });
  }

  function handleEdgeClick(_event: ReactMouseEvent, edge: KnowledgeFlowEdge) {
    const sourceLabel = edge.data?.sourceLabel ?? edge.source;
    const targetLabel = edge.data?.targetLabel ?? edge.target;

    startTransition(() => {
      setChatDomain(edge.data?.domain ?? null);
      setChatPrompt(
        `Explain the roadmap connection between "${sourceLabel}" and "${targetLabel}".`
      );
    });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <div className="topbar-logo">
            <BookOpen style={{ width: 15, height: 15, color: "white" }} />
          </div>
          <div>
            <div className="topbar-name">{roadmapTitle}</div>
            <div className="topbar-subtitle">
              Ask for medicine, commerce, finance, arts, law, technology, or any career field in the chat. The graph will expand into a detailed roadmap automatically.
            </div>
          </div>
        </div>

        <div className="topbar-actions">
          <button className="change-btn" onClick={onResetGraph}>
            <RotateCcw style={{ width: 14, height: 14 }} />
            Reset overview
          </button>
        </div>
      </header>

      <div className="main-area">
        <section className="graph-stage graph-stage-full">
          <div className="canvas-shell">
            <div className="canvas-wrapper">
              <div className="canvas-hint">
                Click any node for context, or type a topic in the right chat to generate a deeper roadmap.
              </div>

              {generating ? (
                <div className="canvas-hint canvas-hint-secondary">
                  Generating detailed roadmap...
                </div>
              ) : null}

              {generationError ? (
                <div className="canvas-error-banner">{generationError}</div>
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
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={28}
                  size={1}
                  color="rgba(255,255,255,0.05)"
                />
                <MiniMap
                  pannable
                  zoomable
                  nodeColor={(node: KnowledgeFlowNode) =>
                    node.type === "nexus"
                      ? "#f0c040"
                      : DOMAIN_META[node.data.domain ?? "science"].color
                  }
                  maskColor="rgba(13,17,23,0.7)"
                  style={{
                    background: "var(--surface)",
                    border: "1px solid var(--border)"
                  }}
                />
                <Controls showInteractive={false} />
              </ReactFlow>
            </div>
          </div>
        </section>

        <aside className="chat-rail">
          <ChatPanel
            domain={chatDomain}
            initialPrompt={chatPrompt}
            generatingRoadmap={generating}
            onRoadmapRequest={onGenerateGraph}
            onClose={() => {
              setChatPrompt(null);
              setChatDomain(null);
            }}
          />
        </aside>
      </div>
    </div>
  );
}

export function UniversalKnowledgeGraph(props: Props) {
  return (
    <ReactFlowProvider>
      <GraphScene {...props} />
    </ReactFlowProvider>
  );
}

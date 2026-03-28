import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";
import { memo } from "react";
import { DOMAIN_META, LEVEL_META, resolveNodeIcon } from "../../lib/domain";
import type { KnowledgeNodeData } from "../../types/knowledge";

const DOMAIN_COLORS = {
  science: { bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.35)", text: "#60a5fa" },
  commerce: { bg: "rgba(34,197,94,0.12)", border: "rgba(34,197,94,0.35)", text: "#4ade80" },
  arts: { bg: "rgba(236,72,153,0.12)", border: "rgba(236,72,153,0.35)", text: "#f472b6" }
} as const;

function DomainNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as KnowledgeNodeData;
  const domain = nodeData.domain ?? "science";
  const level = nodeData.level;
  const meta = DOMAIN_META[domain];
  const levelMeta = level ? LEVEL_META[level] : null;
  const Icon = resolveNodeIcon(nodeData.icon);
  const colors = DOMAIN_COLORS[domain];
  const isStream = nodeData.nodeKind === "stream";

  return (
    <div
      style={{
        background: colors.bg,
        border: `1px solid ${selected ? "rgba(255,255,255,0.5)" : colors.border}`,
        borderRadius: isStream ? "12px" : "10px",
        padding: isStream ? "10px 16px" : "9px 13px",
        minWidth: isStream ? "140px" : "130px",
        maxWidth: isStream ? "170px" : "160px",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: selected
          ? `0 0 0 2px rgba(255,255,255,0.3), 0 0 20px ${colors.border}`
          : `0 0 12px ${colors.bg}`
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 8,
            background: `${colors.text}25`,
            border: `1px solid ${colors.text}40`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0
          }}
        >
          <Icon style={{ width: 13, height: 13, color: colors.text }} />
        </div>
        <div>
          {/* Domain label */}
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: colors.text, marginBottom: 1 }}>
            {isStream ? "STREAM" : meta.label}
          </div>
        </div>
      </div>

      {/* Node title */}
      <div style={{ fontSize: isStream ? 12 : 11, fontWeight: isStream ? 600 : 500, color: "#e6edf3", lineHeight: 1.35 }}>
        {nodeData.label}
      </div>

      {/* Level + Duration */}
      <div style={{ display: "flex", gap: 6, marginTop: 5, flexWrap: "wrap" }}>
        {levelMeta && (
          <span style={{ fontSize: 9, color: "#8b949e", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "1px 6px" }}>
            {levelMeta.label}
          </span>
        )}
        {nodeData.duration && (
          <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 9, color: "#8b949e" }}>
            <Clock style={{ width: 9, height: 9 }} />
            {nodeData.duration}
          </span>
        )}
      </div>

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="target" position={Position.Left} className="opacity-0" />
      <Handle type="target" position={Position.Right} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

export const DomainNode = memo(DomainNodeComponent);

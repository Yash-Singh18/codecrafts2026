import { Handle, Position } from "@xyflow/react";
import { GraduationCap } from "lucide-react";
import { memo } from "react";

function NexusNodeComponent({ data, selected }) {
  return (
    <div
      className="cg-nexus"
      style={{
        position: "relative",
        textAlign: "center",
        minWidth: 180,
        padding: "10px 18px",
        borderRadius: 14,
        background: "rgba(240,192,64,0.1)",
        border: `1px solid ${selected ? "rgba(255,255,255,0.5)" : "rgba(240,192,64,0.3)"}`,
        cursor: "pointer",
      }}
    >
      <div className="cg-nexus__ring" />
      <div style={{ display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}>
        <div
          style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(240,192,64,0.2)", border: "1px solid rgba(240,192,64,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <GraduationCap style={{ width: 16, height: 16, color: "#fde68a" }} />
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>
          {data.label}
        </h3>
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Left} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

export const NexusNode = memo(NexusNodeComponent);

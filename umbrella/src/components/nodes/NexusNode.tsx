import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GraduationCap } from "lucide-react";
import { memo } from "react";
import type { KnowledgeNodeData } from "../../types/knowledge";

function NexusNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as KnowledgeNodeData;

  return (
    <div className={`nb-nexus relative text-center min-w-[180px] ${selected ? "selected" : ""}`}>
      {/* Pulsing ring */}
      <div className="nexus-ring absolute inset-[-10px] rounded-[20px] border border-yellow-400/30 pointer-events-none" />
      <div className="flex items-center gap-2 justify-center">
        <div className="w-7 h-7 rounded-lg bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center">
          <GraduationCap className="w-4 h-4 text-yellow-300" />
        </div>
        <h3 className="text-sm font-semibold text-white">{nodeData.label}</h3>
      </div>
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
      <Handle type="source" position={Position.Left} className="opacity-0" />
      <Handle type="source" position={Position.Right} className="opacity-0" />
    </div>
  );
}

export const NexusNode = memo(NexusNodeComponent);

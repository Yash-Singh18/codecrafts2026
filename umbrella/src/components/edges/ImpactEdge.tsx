import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps
} from "@xyflow/react";
import { DOMAIN_META } from "../../lib/domain";
import type { KnowledgeEdgeData } from "../../types/knowledge";

export function ImpactEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  label,
  data
}: EdgeProps) {
  const edgeData = data as KnowledgeEdgeData | undefined;
  const domain = edgeData?.domain ?? "science";
  const meta = DOMAIN_META[domain];
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    curvature: 0.28
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className="impact-edge-path"
        style={{
          stroke: meta.color,
          strokeWidth: 2.5
        }}
      />
      <circle r="3.5" fill={meta.color} opacity="0.95">
        <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
      </circle>
      <circle r="7" fill={`${meta.color}33`}>
        <animateMotion dur="2.2s" repeatCount="indefinite" path={path} />
      </circle>
      {label ? (
        <EdgeLabelRenderer>
          <div
            className="glass-panel absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-100"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              borderColor: `${meta.color}44`
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

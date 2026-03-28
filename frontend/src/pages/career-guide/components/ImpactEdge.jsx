import { BaseEdge, EdgeLabelRenderer, getBezierPath } from "@xyflow/react";
import { DOMAIN_META } from "../lib/domain";

export function ImpactEdge({
  id, sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition, label, data,
}) {
  const domain = data?.domain ?? "science";
  const meta = DOMAIN_META[domain];
  const [path, labelX, labelY] = getBezierPath({
    sourceX, sourceY, targetX, targetY,
    sourcePosition, targetPosition, curvature: 0.28,
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        className="cg-impact-edge-path"
        style={{ stroke: meta.color, strokeWidth: 2.5 }}
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
            className="cg-edge-label-wrapper nodrag nopan"
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              pointerEvents: 'all',
            }}
          >
            <div
              className="cg-edge-label"
              style={{
                borderColor: `${meta.color}44`,
              }}
            >
              {label}
            </div>
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
}

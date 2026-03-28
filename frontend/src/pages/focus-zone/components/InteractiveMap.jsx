import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Circle } from "lucide-react";

function MapNode({ node, depth = 0, activeId, onSelect }) {
  const [expanded, setExpanded] = useState(depth === 0);
  const hasChildren = node.children && node.children.length > 0;
  const isRoot = depth === 0;
  const isActive = node._id === activeId;

  const handleClick = useCallback(() => {
    if (hasChildren) setExpanded((v) => !v);
    onSelect(node._id);
  }, [hasChildren, node._id, onSelect]);

  return (
    <div className={`ftree-node ${isRoot ? 'ftree-node--root' : ''}`}>
      <div 
        className={`ftree-node__wrap ${hasChildren && expanded ? 'ftree-node__wrap--expanded' : ''}`}
      >
        <button
          className={`ftree-box ${isActive ? 'ftree-box--active' : ''} ${isRoot ? 'ftree-box--root' : ''}`}
          onClick={handleClick}
          type="button"
        >
          <div className="ftree-box__header">
            <span className="ftree-box__icon">
              {hasChildren ? (
                <ChevronRight size={16} className={`ftree-box__chevron ${expanded ? 'ftree-box__chevron--open' : ''}`} />
              ) : (
                <Circle size={8} className="ftree-box__dot" />
              )}
            </span>
            <span className="ftree-box__label">{node.label}</span>
            {!expanded && hasChildren && (
              <span className="ftree-box__badge">{node.children.length} Nodes</span>
            )}
          </div>
          
          <AnimatePresence>
            {isActive && node.detail && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="ftree-box__detail-wrap"
              >
                <div className="ftree-box__detail">
                  {node.detail}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      <AnimatePresence>
        {expanded && hasChildren && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, x: -10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, x: -10 }}
            transition={{ duration: 0.2 }}
            className="ftree-children"
          >
            {node.children.map((child, i) => (
              <div key={child._id ?? i} className="ftree-child">
                <MapNode
                  node={child}
                  depth={depth + 1}
                  activeId={activeId}
                  onSelect={onSelect}
                />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Assign stable IDs so we can track which node is active
function assignIds(node, prefix = "0") {
  const out = { ...node, _id: prefix };
  if (node.children?.length) {
    out.children = node.children.map((c, i) => assignIds(c, `${prefix}-${i}`));
  }
  return out;
}

export default function InteractiveMap({ tree }) {
  const idTree = tree ? assignIds(tree) : null;
  const [activeId, setActiveId] = useState("0");

  if (!idTree) {
    return <p className="ftree-empty">No logic map available.</p>;
  }

  return (
    <div className="ftree">
      <p className="ftree__hint">Click any node to expand and reveal more branches. Drag to scroll if map gets wide.</p>
      <div className="ftree__container">
        <MapNode node={idTree} depth={0} activeId={activeId} onSelect={setActiveId} />
      </div>
    </div>
  );
}

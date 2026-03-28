import { AnimatePresence, motion } from "framer-motion";
import { Brain, Clock, Link2, Sparkles, X } from "lucide-react";
import { DOMAIN_META, LEVEL_META } from "../lib/domain";
import type { SidebarSelection } from "../types/knowledge";

type Props = {
  selection: SidebarSelection | null;
  summary: string;
  loading: boolean;
  error: string | null;
  onClose: () => void;
};

const DOMAIN_COLORS: Record<string, { text: string; bg: string }> = {
  science: { text: "#60a5fa", bg: "rgba(59,130,246,0.12)" },
  commerce: { text: "#4ade80", bg: "rgba(34,197,94,0.12)" },
  arts: { text: "#f472b6", bg: "rgba(236,72,153,0.12)" },
  nexus: { text: "#f0c040", bg: "rgba(240,192,64,0.12)" },
  stream: { text: "#a78bfa", bg: "rgba(167,139,250,0.12)" }
};

export function KnowledgeSidebar({ selection, summary, loading, error, onClose }: Props) {
  const domainKey = selection?.domain ?? "science";
  const colors = DOMAIN_COLORS[domainKey] ?? DOMAIN_COLORS.science;
  const metaKey = domainKey === "nexus" || domainKey === "stream" ? "science" : domainKey;
  const meta = DOMAIN_META[metaKey as keyof typeof DOMAIN_META];
  const levelMeta = selection?.level ? LEVEL_META[selection.level] : null;

  return (
    <AnimatePresence>
      {selection && (
        <motion.div
          key={selection.id}
          className="side-panel"
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 40, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* ── Header ── */}
          <div className="panel-header" style={{ borderLeft: `3px solid ${colors.text}` }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Domain badge */}
                <div
                  className="panel-domain-badge"
                  style={{ background: colors.bg, color: colors.text }}
                >
                  {selection.kind === "edge" ? (
                    <><Link2 style={{ width: 10, height: 10 }} /> Cross-domain Link</>
                  ) : (
                    <><Brain style={{ width: 10, height: 10 }} /> {meta?.label ?? "Milestone"}</>
                  )}
                </div>

                <h2 className="panel-title">{selection.label}</h2>

                {/* Meta chips */}
                <div className="panel-meta">
                  {levelMeta && (
                    <span className="meta-chip">{levelMeta.label}</span>
                  )}
                  {selection.duration && (
                    <span className="meta-chip">
                      <Clock style={{ width: 10, height: 10 }} />
                      {selection.duration}
                    </span>
                  )}
                </div>
              </div>

              <button className="close-btn" onClick={onClose} aria-label="Close">
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>
          </div>

          {/* ── Body ── */}
          <div className="panel-body">
            {/* Description */}
            {selection.description && (
              <>
                <p className="panel-section-title">About</p>
                <div className="panel-description">{selection.description}</div>
              </>
            )}

            {/* Connected nodes */}
            {selection.connectedLabels && selection.connectedLabels.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p className="panel-section-title">Connected to</p>
                <div className="connected-chips">
                  {selection.connectedLabels.slice(0, 6).map((lbl) => (
                    <span key={lbl} className="connected-chip">{lbl}</span>
                  ))}
                </div>
              </div>
            )}

            {/* AI Section */}
            <div className="ai-section">
              <div className="ai-label">
                <Sparkles style={{ width: 12, height: 12, color: colors.text }} />
                <span style={{ color: colors.text }}>AI Career Guide</span>
              </div>

              {loading ? (
                <div className="ai-skeleton">
                  {[90, 75, 85, 60, 78].map((w, i) => (
                    <div
                      key={i}
                      className="skeleton-line"
                      style={{
                        width: `${w}%`,
                        background: `linear-gradient(90deg, ${colors.bg}, ${colors.text}33, ${colors.bg})`
                      }}
                    />
                  ))}
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 4 }}>
                    Generating insight from Groq…
                  </div>
                </div>
              ) : error ? (
                <div className="ai-error">
                  <strong>⚠ Could not load AI insight</strong>
                  <br />{error}
                  <br />
                  <span style={{ fontSize: 11, color: "#8b949e", marginTop: 6, display: "block" }}>
                    Make sure <code style={{ color: "#f0c040" }}>GROQ_API_KEY</code> is set for the server and restart the dev process.
                  </span>
                </div>
              ) : summary ? (
                <p className="ai-content">{summary}</p>
              ) : (
                <p style={{ fontSize: 13, color: "var(--text-muted)", fontStyle: "italic" }}>
                  AI explanation will stream here...
                </p>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

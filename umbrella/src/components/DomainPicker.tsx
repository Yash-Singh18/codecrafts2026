import { AnimatePresence, motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import type { Domain } from "../types/knowledge";

type Props = {
  onSelect: (domain: Domain) => void;
};

const DOMAINS: Array<{
  domain: Domain;
  emoji: string;
  label: string;
  sub: string;
  color: string;
  border: string;
  shadow: string;
  bg: string;
  careers: string[];
}> = [
  {
    domain: "science",
    emoji: "🔬",
    label: "Science",
    sub: "Engineering, Medicine & Technology",
    color: "#3b82f6",
    border: "rgba(59,130,246,0.35)",
    shadow: "rgba(59,130,246,0.15)",
    bg: "rgba(59,130,246,0.08)",
    careers: ["IIT-JEE", "NEET", "GATE", "AI/ML", "MBBS"]
  },
  {
    domain: "commerce",
    emoji: "📈",
    label: "Commerce",
    sub: "Finance, Business & Law",
    color: "#22c55e",
    border: "rgba(34,197,94,0.35)",
    shadow: "rgba(34,197,94,0.15)",
    bg: "rgba(34,197,94,0.08)",
    careers: ["CA", "MBA", "Banking", "Law", "Startup"]
  },
  {
    domain: "arts",
    emoji: "🎨",
    label: "Arts",
    sub: "Design, Humanities & Social Science",
    color: "#ec4899",
    border: "rgba(236,72,153,0.35)",
    shadow: "rgba(236,72,153,0.15)",
    bg: "rgba(236,72,153,0.08)",
    careers: ["UPSC", "UX Design", "Journalism", "Law", "Psychology"]
  }
];

export function DomainPicker({ onSelect }: Props) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? DOMAINS.filter(
        (d) =>
          d.label.toLowerCase().includes(query.toLowerCase()) ||
          d.careers.some((c) => c.toLowerCase().includes(query.toLowerCase())) ||
          d.sub.toLowerCase().includes(query.toLowerCase())
      )
    : DOMAINS;

  return (
    <motion.div
      className="picker-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* Title */}
      <div className="picker-title">
        <h1>What stream are you in?</h1>
        <p>Pick your stream to load your personalised roadmap — then click any node to chat with AI.</p>
      </div>

      {/* Search */}
      <div className="picker-search-wrap">
        <Search className="picker-search-icon" style={{ width: 18, height: 18 }} />
        <input
          className="picker-search"
          placeholder="Search by stream or career (e.g. NEET, MBA, UPSC…)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
        />
      </div>

      {/* Cards */}
      <div className="picker-cards">
        <AnimatePresence mode="popLayout">
          {filtered.map((d, i) => (
            <motion.button
              key={d.domain}
              className="picker-card"
              style={{
                borderColor: d.border,
                boxShadow: `0 8px 32px ${d.shadow}`
              }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ delay: i * 0.06, duration: 0.22 }}
              whileHover={{ boxShadow: `0 12px 40px ${d.shadow}` }}
              onClick={() => onSelect(d.domain)}
            >
              <div
                className="picker-card-icon"
                style={{ background: d.bg, border: `1px solid ${d.border}` }}
              >
                {d.emoji}
              </div>
              <div>
                <h3>{d.label}</h3>
                <p style={{ marginTop: 6 }}>{d.sub}</p>
                {/* Career tags */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 10 }}>
                  {d.careers.map((c) => (
                    <span
                      key={c}
                      style={{
                        fontSize: 10, padding: "2px 7px", borderRadius: 8,
                        background: d.bg, color: d.color,
                        border: `1px solid ${d.border}`
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>
              <div className="picker-card-arrow" style={{ color: d.color }}>
                Explore roadmap →
              </div>
            </motion.button>
          ))}
        </AnimatePresence>

        {filtered.length === 0 && (
          <p style={{ color: "var(--muted)", fontSize: 14 }}>
            No stream found for "{query}" — try Science, Commerce, or Arts.
          </p>
        )}
      </div>
    </motion.div>
  );
}

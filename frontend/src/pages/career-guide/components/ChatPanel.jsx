import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { streamChatMessage } from "../lib/groq";

const DOMAIN_COLORS = {
  science: { color: "#3b82f6" },
  commerce: { color: "#22c55e" },
  arts: { color: "#ec4899" },
  general: { color: "#f0c040" },
};

function parseFlowSteps(text) {
  const arrowPattern = / ?[-=]> ?| ?\u2192 ?/g;
  const sentences = text.split(/\n/);
  for (const sentence of sentences) {
    const parts = sentence.split(arrowPattern).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length < 40)) return parts;
  }
  return [];
}

function InlineFlow({ steps, color }) {
  return (
    <div className="cg-inline-flow">
      {steps.map((step, i) => (
        <div className="cg-flow-step" key={i}>
          <span
            className="cg-flow-node"
            style={{ color, borderColor: `${color}55`, background: `${color}18` }}
          >
            {step}
          </span>
          {i < steps.length - 1 ? <span className="cg-flow-arrow">{"->"}</span> : null}
        </div>
      ))}
    </div>
  );
}

function AssistantBubble({ content, color }) {
  const flowSteps = parseFlowSteps(content);
  return (
    <div className="cg-bubble">
      {flowSteps.length >= 2 ? <InlineFlow steps={flowSteps} color={color} /> : null}
      <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
    </div>
  );
}

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

export function ChatPanel({ domain, initialPrompt, generatingRoadmap, onRoadmapRequest, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef(null);
  const bottomRef = useRef(null);
  const color = DOMAIN_COLORS[domain ?? "general"].color;
  const lastPromptRef = useRef(null);

  useEffect(() => {
    if (!initialPrompt || initialPrompt === lastPromptRef.current) return;
    lastPromptRef.current = initialPrompt;
    void doSend(initialPrompt, { regenerateRoadmap: false });
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generatingRoadmap]);

  async function doSend(text, options) {
    if (!text.trim() || streaming) return;
    abortRef.current?.abort();

    const userMsg = { id: newId(), role: "user", content: text.trim() };
    const assistantId = newId();
    const history = [...messages, userMsg];
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => [...prev, userMsg, { id: assistantId, role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    try {
      const tasks = [
        streamChatMessage(
          domain,
          history,
          (chunk) =>
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: m.content + chunk } : m))
            ),
          controller.signal
        ),
      ];

      if (options.regenerateRoadmap) tasks.push(onRoadmapRequest(text.trim()));

      const [chatResult, roadmapResult] = await Promise.allSettled(tasks);

      if (chatResult.status === "rejected") throw chatResult.reason;

      if (roadmapResult && roadmapResult.status === "rejected") {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: m.content + `\n\nRoadmap update warning: ${roadmapResult.reason.message}` }
              : m
          )
        );
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantId ? { ...m, content: `Warning: ${error.message}` } : m))
        );
      }
    } finally {
      if (!controller.signal.aborted) setStreaming(false);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void doSend(input, { regenerateRoadmap: true });
    }
  }

  const QUICK_ASKS = ["Medicine roadmap", "Technology roadmap", "Finance roadmap", "Civil services roadmap"];

  function handleClearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
    lastPromptRef.current = null;
    onClose();
  }

  return (
    <div className="cg-chat-panel">
      <div className="cg-chat-panel__header">
        <div>
          <div className="cg-chat-panel__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, display: "inline-block" }} />
            AI Roadmap Guide
          </div>
          <div className="cg-chat-panel__sub">
            Type any field and the graph will expand into a detailed roadmap.
          </div>
        </div>
        <button className="cg-close-btn" onClick={handleClearChat} aria-label="Clear chat">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div className="cg-chat-messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: "center", color: "#8b949e", fontSize: 13, padding: "32px 8px" }}>
            <div style={{ fontSize: 30, marginBottom: 12 }}>Roadmap</div>
            <p>
              Ask for medicine, technology, finance, arts, commerce, law, design,
              or any student goal. The left graph will redraw with a detailed path.
            </p>
          </div>
        ) : null}

        {generatingRoadmap ? (
          <div className="cg-roadmap-status">
            <LoaderCircle className="cg-spin" style={{ width: 14, height: 14, color }} />
            Updating flowchart from your prompt...
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`cg-msg cg-msg--${message.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <span className="cg-msg__label">{message.role === "user" ? "You" : "AI Guide"}</span>
              {message.role === "assistant" ? (
                message.content === "" && streaming ? (
                  <div className="cg-bubble" style={{ padding: "10px 14px" }}>
                    <div className="cg-typing-dots"><span /><span /><span /></div>
                  </div>
                ) : (
                  <AssistantBubble content={message.content} color={color} />
                )
              ) : (
                <div className="cg-bubble">{message.content}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 ? (
        <div style={{ padding: "0 16px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUICK_ASKS.map((q) => (
            <button
              key={q}
              onClick={() => void doSend(q, { regenerateRoadmap: true })}
              style={{
                fontSize: 11, padding: "5px 11px", borderRadius: 12, cursor: "pointer",
                border: `1px solid ${color}44`, background: `${color}10`, color, fontFamily: "inherit",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      ) : null}

      <div className="cg-chat-input-area">
        <textarea
          className="cg-chat-input"
          rows={1}
          placeholder="Type a field, exam path, or career goal..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="cg-send-btn"
          onClick={() => void doSend(input, { regenerateRoadmap: true })}
          disabled={!input.trim() || streaming}
          style={{ background: input.trim() && !streaming ? color : undefined }}
        >
          <Send style={{ width: 15, height: 15 }} />
        </button>
      </div>
    </div>
  );
}

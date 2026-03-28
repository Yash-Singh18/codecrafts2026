import { AnimatePresence, motion } from "framer-motion";
import { LoaderCircle, Send, X } from "lucide-react";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { streamChatMessage } from "../lib/groq";
import type { ChatMessage, Domain } from "../types/knowledge";

type Props = {
  domain: Domain | null;
  initialPrompt: string | null;
  generatingRoadmap: boolean;
  onRoadmapRequest: (prompt: string) => Promise<void>;
  onClose: () => void;
};

const DOMAIN_COLORS: Record<Domain | "general", { color: string }> = {
  science: { color: "#3b82f6" },
  commerce: { color: "#22c55e" },
  arts: { color: "#ec4899" },
  general: { color: "#f0c040" }
};

function parseFlowSteps(text: string): string[] {
  const arrowPattern = / ?[-=]> ?| ?\u2192 ?/g;
  const sentences = text.split(/\n/);
  for (const sentence of sentences) {
    const parts = sentence.split(arrowPattern).map((part) => part.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((part) => part.length < 40)) {
      return parts;
    }
  }
  return [];
}

function InlineFlow({ steps, color }: { steps: string[]; color: string }) {
  return (
    <div className="inline-flow">
      {steps.map((step, index) => (
        <div className="flow-step" key={index}>
          <span
            className="flow-node"
            style={{ color, borderColor: `${color}55`, background: `${color}18` }}
          >
            {step}
          </span>
          {index < steps.length - 1 ? <span className="flow-arrow">{"->"}</span> : null}
        </div>
      ))}
    </div>
  );
}

function AssistantBubble({ content, color }: { content: string; color: string }) {
  const flowSteps = parseFlowSteps(content);
  return (
    <div className="bubble">
      {flowSteps.length >= 2 ? <InlineFlow steps={flowSteps} color={color} /> : null}
      <span style={{ whiteSpace: "pre-wrap" }}>{content}</span>
    </div>
  );
}

let msgCounter = 0;
const newId = () => `msg-${++msgCounter}-${Date.now()}`;

export function ChatPanel({
  domain,
  initialPrompt,
  generatingRoadmap,
  onRoadmapRequest,
  onClose
}: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const color = DOMAIN_COLORS[domain ?? "general"].color;
  const lastPromptRef = useRef<string | null>(null);

  useEffect(() => {
    if (!initialPrompt || initialPrompt === lastPromptRef.current) {
      return;
    }
    lastPromptRef.current = initialPrompt;
    void doSend(initialPrompt, { regenerateRoadmap: false });
  }, [initialPrompt]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generatingRoadmap]);

  async function doSend(
    text: string,
    options: { regenerateRoadmap: boolean }
  ) {
    if (!text.trim() || streaming) {
      return;
    }

    abortRef.current?.abort();

    const userMsg: ChatMessage = { id: newId(), role: "user", content: text.trim() };
    const assistantId = newId();
    const history = [...messages, userMsg];
    const controller = new AbortController();
    abortRef.current = controller;

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: assistantId, role: "assistant", content: "" }
    ]);
    setInput("");
    setStreaming(true);

    try {
      const tasks: Array<Promise<unknown>> = [
        streamChatMessage(
          domain,
          history,
          (chunk) =>
            setMessages((prev) =>
              prev.map((message) =>
                message.id === assistantId
                  ? { ...message, content: message.content + chunk }
                  : message
              )
            ),
          controller.signal
        )
      ];

      if (options.regenerateRoadmap) {
        tasks.push(onRoadmapRequest(text.trim()));
      }

      const [chatResult, roadmapResult] = await Promise.allSettled(tasks);

      if (chatResult.status === "rejected") {
        throw chatResult.reason;
      }

      if (roadmapResult && roadmapResult.status === "rejected") {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? {
                  ...message,
                  content:
                    message.content +
                    `\n\nRoadmap update warning: ${(roadmapResult.reason as Error).message}`
                }
              : message
          )
        );
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantId
              ? { ...message, content: `Warning: ${(error as Error).message}` }
              : message
          )
        );
      }
    } finally {
      if (!controller.signal.aborted) {
        setStreaming(false);
      }
    }
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void doSend(input, { regenerateRoadmap: true });
    }
  }

  const QUICK_ASKS = [
    "Medicine roadmap",
    "Technology roadmap",
    "Finance roadmap",
    "Civil services roadmap"
  ];

  function handleClearChat() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    setStreaming(false);
    lastPromptRef.current = null;
    onClose();
  }

  return (
    <div className="chat-panel">
      <div className="chat-panel-header">
        <div>
          <div
            className="chat-panel-title"
            style={{ display: "flex", alignItems: "center", gap: 8 }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: color,
                display: "inline-block"
              }}
            />
            AI Roadmap Guide
          </div>
          <div className="chat-panel-sub">
            Type any field and the graph will expand into a detailed roadmap.
          </div>
        </div>
        <button className="close-btn" onClick={handleClearChat} aria-label="Clear chat">
          <X style={{ width: 14, height: 14 }} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              color: "var(--muted)",
              fontSize: 13,
              padding: "32px 8px"
            }}
          >
            <div style={{ fontSize: 30, marginBottom: 12 }}>Roadmap</div>
            <p>
              Ask for medicine, technology, finance, arts, commerce, law, design,
              or any student goal. The left graph will redraw with a detailed path.
            </p>
          </div>
        ) : null}

        {generatingRoadmap ? (
          <div className="roadmap-status">
            <LoaderCircle className="animate-spin" style={{ width: 14, height: 14, color }} />
            Updating flowchart from your prompt...
          </div>
        ) : null}

        <AnimatePresence initial={false}>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              className={`msg msg-${message.role}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <span className="msg-label">
                {message.role === "user" ? "You" : "AI Guide"}
              </span>
              {message.role === "assistant" ? (
                message.content === "" && streaming ? (
                  <div className="bubble" style={{ padding: "10px 14px" }}>
                    <div className="typing-dots">
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>
                ) : (
                  <AssistantBubble content={message.content} color={color} />
                )
              ) : (
                <div className="bubble">{message.content}</div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 ? (
        <div style={{ padding: "0 16px 10px", display: "flex", flexWrap: "wrap", gap: 6 }}>
          {QUICK_ASKS.map((question) => (
            <button
              key={question}
              onClick={() => void doSend(question, { regenerateRoadmap: true })}
              style={{
                fontSize: 11,
                padding: "5px 11px",
                borderRadius: 12,
                cursor: "pointer",
                border: `1px solid ${color}44`,
                background: `${color}10`,
                color,
                fontFamily: "inherit"
              }}
            >
              {question}
            </button>
          ))}
        </div>
      ) : null}

      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows={1}
          placeholder="Type a field, exam path, or career goal..."
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="send-btn"
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

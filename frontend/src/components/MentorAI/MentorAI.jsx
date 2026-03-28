import { useState, useEffect, useRef, useCallback } from 'react';
import { mentorService } from '../../services/mentor/mentorService';
import { profileService } from '../../services/supabase/profileService';
import './MentorAI.css';

// ── Markdown renderer ─────────────────────────────────────────────

function renderInline(text) {
  const parts = text.split(/(\*\*[\s\S]*?\*\*|\*[\s\S]*?\*|`[^`\n]*`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="ma__inline-code">{part.slice(1, -1)}</code>;
    return <span key={i}>{part}</span>;
  });
}

function MarkdownBlock({ text }) {
  if (!text) return null;

  // Split on fenced code blocks first
  const segments = text.split(/(```[\s\S]*?```)/g);
  const nodes = [];

  segments.forEach((seg, si) => {
    // Code block
    if (seg.startsWith('```')) {
      const inner = seg.slice(3, -3);
      const nl = inner.indexOf('\n');
      const lang = nl > -1 ? inner.slice(0, nl).trim() : '';
      const code = nl > -1 ? inner.slice(nl + 1) : inner;
      nodes.push(
        <div key={`cb-${si}`} className="ma__code-block">
          {lang && <div className="ma__code-lang">{lang}</div>}
          <pre><code>{code.trimEnd()}</code></pre>
        </div>
      );
      return;
    }

    // Process line by line
    const lines = seg.split('\n');
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];

      if (line.startsWith('### ')) {
        nodes.push(<h3 key={`${si}-${i}`} className="ma__md-h3">{renderInline(line.slice(4))}</h3>);
        i++; continue;
      }
      if (line.startsWith('## ')) {
        nodes.push(<h2 key={`${si}-${i}`} className="ma__md-h2">{renderInline(line.slice(3))}</h2>);
        i++; continue;
      }
      if (line.startsWith('# ')) {
        nodes.push(<h1 key={`${si}-${i}`} className="ma__md-h1">{renderInline(line.slice(2))}</h1>);
        i++; continue;
      }
      if (/^[-*] /.test(line)) {
        const items = [];
        while (i < lines.length && /^[-*] /.test(lines[i])) {
          items.push(<li key={i}>{renderInline(lines[i].slice(2))}</li>);
          i++;
        }
        nodes.push(<ul key={`${si}-ul-${i}`} className="ma__md-list">{items}</ul>);
        continue;
      }
      if (/^\d+\. /.test(line)) {
        const items = [];
        while (i < lines.length && /^\d+\. /.test(lines[i])) {
          items.push(<li key={i}>{renderInline(lines[i].replace(/^\d+\. /, ''))}</li>);
          i++;
        }
        nodes.push(<ol key={`${si}-ol-${i}`} className="ma__md-list ma__md-ol">{items}</ol>);
        continue;
      }
      if (line.startsWith('> ')) {
        nodes.push(<blockquote key={`${si}-${i}`} className="ma__md-quote">{renderInline(line.slice(2))}</blockquote>);
        i++; continue;
      }
      if (!line.trim()) { i++; continue; }

      nodes.push(<p key={`${si}-${i}`} className="ma__md-p">{renderInline(line)}</p>);
      i++;
    }
  });

  return <div className="ma__markdown">{nodes}</div>;
}

// ── Constants ─────────────────────────────────────────────────────

const SUGGESTIONS = [
  'How am I doing overall?',
  'What should I focus on next?',
  'Where am I weakest?',
  'Give me a study plan',
];

const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/>
    <polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
);
const IconClose = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconExpand = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/>
    <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
  </svg>
);
const IconCollapse = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 14 10 14 10 20"/><polyline points="20 10 14 10 14 4"/>
    <line x1="10" y1="14" x2="3" y2="21"/><line x1="21" y1="3" x2="14" y2="10"/>
  </svg>
);

// ── Main component ────────────────────────────────────────────────

export default function MentorAI({ user, profile }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [contextLoading, setContextLoading] = useState(false);
  const [userContext, setUserContext] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Lock body scroll in full page mode
  useEffect(() => {
    if (expanded) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [expanded]);

  // Load context once on open
  useEffect(() => {
    if (!open || userContext || !user) return;

    const load = async () => {
      setContextLoading(true);
      try {
        const attempts = await profileService.getTestAttempts(user.id);
        const ctx = {
          profile: profile
            ? { username: profile.username, full_name: profile.full_name, grade: profile.grade }
            : null,
          test_attempts: attempts,
        };
        setUserContext(ctx);

        const name = profile?.username ? ` @${profile.username}` : '';
        const greeting = attempts.length === 0
          ? `Hey${name}! I'm **MentorAI** — your personal study mentor.\n\nYou haven't taken any tests yet. Once you do, I'll have full visibility into your performance and give you personalised guidance. For now, feel free to ask me anything!`
          : `Hey${name}! I'm **MentorAI** — I've reviewed your **${attempts.length} test${attempts.length > 1 ? 's' : ''}**.\n\nI can see your strengths, weak spots, and patterns across your topics. What would you like to work on today?`;

        setMessages([{ role: 'assistant', content: greeting }]);
      } catch {
        setMessages([{ role: 'assistant', content: "Hi! I'm **MentorAI**. I couldn't load your test data right now, but feel free to ask me study questions!" }]);
      } finally {
        setContextLoading(false);
      }
    };

    load();
  }, [open, user, profile, userContext]);

  useEffect(() => {
    if (open && !user && messages.length === 0) {
      setMessages([{ role: 'assistant', content: "Hi! I'm **MentorAI**.\n\nSign in to unlock personalised mentoring based on your test history. I'll track your progress and tell you exactly what to study next." }]);
    }
  }, [open, user, messages.length]);

  const sendMessage = useCallback(async (text) => {
    const content = (text || input).trim();
    if (!content || streaming) return;

    const userMsg = { role: 'user', content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setStreaming(true);
    setMessages([...newMessages, { role: 'assistant', content: '' }]);

    try {
      const apiMessages = newMessages.map(m => ({ role: m.role, content: m.content }));
      await mentorService.chatStream(
        apiMessages,
        userContext || { profile: null, test_attempts: [] },
        (partial) => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: 'assistant', content: partial };
            return updated;
          });
        }
      );
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
        return updated;
      });
    } finally {
      setStreaming(false);
      inputRef.current?.focus();
    }
  }, [input, messages, streaming, userContext]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + 'px';
  };

  const showSuggestions = user && messages.length <= 1 && !streaming && !contextLoading;

  const msgNodes = (fullPage) => (
    <>
      {contextLoading ? (
        <div className="ma__loading">
          <span className="ma__loading-dot" />
          <span className="ma__loading-dot" />
          <span className="ma__loading-dot" />
        </div>
      ) : messages.map((msg, i) => (
        <div key={i} className={`ma__msg ma__msg--${msg.role}${fullPage ? ' ma__msg--full' : ''}`}>
          {msg.role === 'assistant' && (
            <div className={`ma__msg-avatar${fullPage ? ' ma__msg-avatar--full' : ''}`}>M</div>
          )}
          <div className={`ma__msg-bubble ma__msg-bubble--${msg.role}${fullPage ? ' ma__msg-bubble--full' : ''}`}>
            <MarkdownBlock text={msg.content} />
            {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
              <span className="ma__cursor" />
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </>
  );

  const inputBar = (fullPage) => (
    <div className={`ma__input-wrap${fullPage ? ' ma__input-wrap--full' : ''}`}>
      {showSuggestions && (
        <div className={`ma__suggestions${fullPage ? ' ma__suggestions--full' : ''}`}>
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="ma__suggestion" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="ma__input-row">
        <textarea
          ref={el => { inputRef.current = el; textareaRef.current = el; }}
          className="ma__input"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={user ? 'Message MentorAI...' : 'Sign in to chat'}
          disabled={streaming || !user}
          rows={1}
          autoComplete="off"
        />
        <button
          className="ma__send"
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming || !user}
        >
          <IconSend />
        </button>
      </div>
      {fullPage && (
        <p className="ma__disclaimer">MentorAI can make mistakes. Verify important information.</p>
      )}
    </div>
  );

  return (
    <>
      {/* ── FAB ─────────────────────────────────────────────────── */}
      <button
        className={`ma__fab ${open ? 'ma__fab--open' : ''}`}
        onClick={() => setOpen(v => !v)}
        aria-label="Open MentorAI"
      >
        {open ? <IconClose /> : (
          <>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="ma__fab-label">MentorAI</span>
          </>
        )}
      </button>

      {/* ── Floating panel ──────────────────────────────────────── */}
      {open && !expanded && (
        <div className="ma__panel">
          <div className="ma__panel-header">
            <div className="ma__header-info">
              <div className="ma__avatar">M</div>
              <div>
                <p className="ma__header-title">MentorAI</p>
                <p className="ma__header-sub">
                  <span className="ma__status-dot" /> Online
                </p>
              </div>
            </div>
            <div className="ma__header-btns">
              <button className="ma__icon-btn" onClick={() => setExpanded(true)} title="Full page">
                <IconExpand />
              </button>
              <button className="ma__icon-btn" onClick={() => setOpen(false)} title="Close">
                <IconClose />
              </button>
            </div>
          </div>

          <div className="ma__panel-msgs">
            {msgNodes(false)}
          </div>

          {inputBar(false)}
        </div>
      )}

      {/* ── Full page ───────────────────────────────────────────── */}
      {open && expanded && (
        <div className="ma__fullpage">
          <div className="ma__fullpage-header">
            <div className="ma__header-info">
              <div className="ma__avatar ma__avatar--lg">M</div>
              <div>
                <p className="ma__header-title">MentorAI</p>
                <p className="ma__header-sub">
                  <span className="ma__status-dot" /> Your personal study mentor
                </p>
              </div>
            </div>
            <div className="ma__header-btns">
              <button className="ma__icon-btn" onClick={() => setExpanded(false)} title="Minimize">
                <IconCollapse />
              </button>
              <button className="ma__icon-btn" onClick={() => { setExpanded(false); setOpen(false); }} title="Close">
                <IconClose />
              </button>
            </div>
          </div>

          <div className="ma__fullpage-msgs">
            <div className="ma__fullpage-inner">
              {msgNodes(true)}
            </div>
          </div>

          <div className="ma__fullpage-input">
            <div className="ma__fullpage-inner">
              {inputBar(true)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

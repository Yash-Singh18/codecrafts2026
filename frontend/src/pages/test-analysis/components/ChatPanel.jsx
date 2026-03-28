import { useState, useRef, useEffect } from 'react';
import { testAnalysisService } from '../../../services/testAnalysis/testAnalysisService';

const SUGGESTIONS = [
  'Why did I get wrong answers?',
  'Explain my weakest topic simply',
  'Give me a 1-week study plan',
  'What should I focus on first?',
];

const formatMessage = (text) => {
  if (!text) return null;
  
  const paragraphs = text.split('\n');
  
  return paragraphs.map((paragraph, pIdx) => {
    // Split by various markdown tokens
    const parts = paragraph.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    
    return (
      <span key={pIdx}>
        {parts.map((part, idx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={idx} style={{ color: 'var(--color-text-primary)' }}>{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={idx}>{part.slice(1, -1)}</em>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return (
              <code key={idx} style={{
                background: 'rgba(0,0,0,0.1)', 
                padding: '2px 4px', 
                borderRadius: '4px',
                color: 'var(--color-accent)'
              }}>
                {part.slice(1, -1)}
              </code>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
        {pIdx < paragraphs.length - 1 && <br />}
      </span>
    );
  });
};

export default function ChatPanel({ questions, answers, analysis, report }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi! I've reviewed your entire test — every answer, timing, and where you struggled. Ask me anything about your results or ask me to explain a concept you got wrong.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const buildContext = () => ({
    questions: questions.map((q, i) => {
      const ans = answers.find(a => a.question_index === i);
      return {
        index: i + 1,
        question: q.question,
        topic: q.topic,
        subtopic: q.subtopic,
        difficulty: q.difficulty,
        correct_answer: q.correct_answer,
        explanation: q.explanation,
        student_answer: ans?.selected_answer || 'unanswered',
        was_correct: ans?.correct ?? false,
        time_taken: ans?.time_taken ?? 0,
        expected_time: q.expected_time_seconds,
      };
    }),
    analysis: {
      overall: analysis.overall,
      topic_performance: analysis.topic_performance,
      weaknesses: analysis.weaknesses,
      insights: analysis.insights,
    },
    report: report || null,
  });

  const sendMessage = async (text) => {
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
      await testAnalysisService.chatStream(apiMessages, buildContext(), (partial) => {
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: partial };
          return updated;
        });
      });
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
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInput = (e) => {
    setInput(e.target.value);
    // auto-resize
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="ic">
      <div className="ic__header">
        <div className="ic__header-left">
          <div className="ic__avatar">AI</div>
          <div>
            <h3 className="ic__title">Ask Your AI Tutor</h3>
            <p className="ic__subtitle">Has full context of your test results</p>
          </div>
        </div>
        <div className="ic__status">
          <span className="ic__status-dot" />
          Online
        </div>
      </div>

      <div className="ic__messages">
        {messages.map((msg, i) => (
          <div key={i} className={`ic__msg ic__msg--${msg.role}`}>
            {msg.role === 'assistant' && <div className="ic__msg-avatar">AI</div>}
            <div className="ic__msg-bubble">
              {formatMessage(msg.content)}
              {streaming && i === messages.length - 1 && msg.role === 'assistant' && (
                <span className="ic__cursor" />
              )}
            </div>
            {msg.role === 'user' && <div className="ic__msg-user-avatar">You</div>}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 2 && !streaming && (
        <div className="ic__suggestions">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="ic__suggestion" onClick={() => sendMessage(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="ic__input-row">
        <textarea
          ref={el => { inputRef.current = el; textareaRef.current = el; }}
          className="ic__input"
          value={input}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your results… (Enter to send, Shift+Enter for newline)"
          rows={1}
          disabled={streaming}
        />
        <button
          className="ic__send"
          onClick={() => sendMessage()}
          disabled={!input.trim() || streaming}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

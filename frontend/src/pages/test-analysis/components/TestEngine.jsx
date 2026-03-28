import { useState, useEffect, useRef, useCallback } from 'react';

export default function TestEngine({ questions, onComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState(() => questions.map(() => ({ selected: null, timeSpent: 0 })));
  const [showHint, setShowHint] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const timerRef = useRef(null);
  const startTimeRef = useRef(Date.now());

  const tickTimer = useCallback(() => {
    setAnswers(prev => {
      const next = [...prev];
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      next[currentIndex] = { ...next[currentIndex], timeSpent: next[currentIndex].timeSpent + (elapsed > 0 ? 1 : 0) };
      startTimeRef.current = Date.now();
      return next;
    });
  }, [currentIndex]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(tickTimer, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, tickTimer]);

  const q = questions[currentIndex];
  const answer = answers[currentIndex];
  const answeredCount = answers.filter(a => a.selected !== null).length;
  const progress = ((currentIndex + 1) / questions.length) * 100;

  const selectOption = (option) => {
    setAnswers(prev => {
      const next = [...prev];
      next[currentIndex] = { ...next[currentIndex], selected: option };
      return next;
    });
  };

  const goTo = (idx) => {
    setShowHint(false);
    setCurrentIndex(idx);
  };

  const handleSubmit = () => {
    if (answeredCount < questions.length) {
      setShowConfirm(true);
      return;
    }
    submitTest();
  };

  const submitTest = () => {
    clearInterval(timerRef.current);
    const results = questions.map((q, i) => ({
      question_index: i,
      selected_answer: answers[i].selected || '',
      correct: answers[i].selected === q.correct_answer,
      time_taken: answers[i].timeSpent,
    }));
    onComplete(results);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);

  return (
    <div className="te">
      {/* Header bar */}
      <div className="te__header">
        <div className="te__meta">
          <span className="te__badge">{q.topic}</span>
          <span className="te__badge te__badge--subtle">{q.subtopic}</span>
          <span className="te__badge te__badge--subtle">{q.difficulty}</span>
        </div>
        <div className="te__timers">
          <span className="te__timer" title="This question">{formatTime(answer.timeSpent)}</span>
          <span className="te__timer te__timer--total" title="Total time">{formatTime(totalTime)}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="te__progress-bar">
        <div className="te__progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Question */}
      <div className="te__question-area">
        <div className="te__question-number">Question {currentIndex + 1} of {questions.length}</div>
        <h2 className="te__question-text">{q.question}</h2>

        <div className="te__options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              className={`te__option ${answer.selected === opt ? 'te__option--selected' : ''}`}
              onClick={() => selectOption(opt)}
            >
              <span className="te__option-letter">{String.fromCharCode(65 + i)}</span>
              <span className="te__option-text">{opt}</span>
            </button>
          ))}
        </div>

        {q.hint && (
          <div className="te__hint-area">
            {showHint ? (
              <div className="te__hint-box">
                <strong>Hint:</strong> {q.hint}
              </div>
            ) : (
              <button className="te__hint-btn" onClick={() => setShowHint(true)}>
                Show Hint
              </button>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="te__nav">
        <button
          className="btn btn--ghost"
          disabled={currentIndex === 0}
          onClick={() => goTo(currentIndex - 1)}
        >
          &larr; Previous
        </button>
        {currentIndex < questions.length - 1 ? (
          <button className="btn btn--primary" onClick={() => goTo(currentIndex + 1)}>
            Next &rarr;
          </button>
        ) : (
          <button className="btn btn--primary" onClick={handleSubmit}>
            Submit Test
          </button>
        )}
      </div>

      {/* Question navigator */}
      <div className="te__navigator">
        {questions.map((_, i) => (
          <button
            key={i}
            className={`te__nav-dot ${
              i === currentIndex
                ? 'te__nav-dot--current'
                : answers[i].selected !== null
                ? 'te__nav-dot--answered'
                : ''
            }`}
            onClick={() => goTo(i)}
          >
            {i + 1}
          </button>
        ))}
      </div>

      <div className="te__footer-info">
        {answeredCount} of {questions.length} answered
        {answeredCount === questions.length && currentIndex < questions.length - 1 && (
          <button className="btn btn--primary te__submit-final" onClick={handleSubmit}>
            Submit Test
          </button>
        )}
      </div>

      {/* Confirm modal */}
      {showConfirm && (
        <div className="te__modal-overlay" onClick={() => setShowConfirm(false)}>
          <div className="te__modal" onClick={e => e.stopPropagation()}>
            <h3>Submit Test?</h3>
            <p>
              You've answered {answeredCount} of {questions.length} questions.
              {answeredCount < questions.length && (
                <> <strong>{questions.length - answeredCount}</strong> questions are unanswered and will be marked incorrect.</>
              )}
            </p>
            <div className="te__modal-actions">
              <button className="btn btn--ghost" onClick={() => setShowConfirm(false)}>Go Back</button>
              <button className="btn btn--primary" onClick={submitTest}>Submit Anyway</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

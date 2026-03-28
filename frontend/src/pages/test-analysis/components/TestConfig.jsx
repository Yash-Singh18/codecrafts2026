import { useState } from 'react';

const SUGGESTED_TOPICS = [
  'Operating Systems', 'DBMS', 'Computer Networks', 'Data Structures',
  'Algorithms', 'OOP', 'System Design', 'Machine Learning',
  'Web Development', 'Discrete Mathematics', 'Computer Architecture',
  'Software Engineering', 'Compiler Design', 'Theory of Computation',
  'Physics', 'Chemistry', 'Mathematics', 'Biology',
];

export default function TestConfig({ onStart, loading }) {
  const [topics, setTopics] = useState([]);
  const [topicInput, setTopicInput] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [numQuestions, setNumQuestions] = useState(10);
  const [questionType, setQuestionType] = useState('mcq');

  const addTopic = (topic) => {
    const trimmed = topic.trim();
    if (trimmed && !topics.includes(trimmed)) {
      setTopics([...topics, trimmed]);
    }
    setTopicInput('');
  };

  const removeTopic = (topic) => {
    setTopics(topics.filter(t => t !== topic));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTopic(topicInput);
    }
  };

  const filteredSuggestions = SUGGESTED_TOPICS.filter(
    t => !topics.includes(t) && t.toLowerCase().includes(topicInput.toLowerCase())
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    if (topics.length === 0) return;
    onStart({ topics, difficulty, num_questions: numQuestions, type: questionType });
  };

  return (
    <div className="tc">
      <div className="tc__header">
        <h1 className="tc__title">Configure Your Test</h1>
        <p className="tc__subtitle">Select topics and preferences to generate an AI-powered adaptive test</p>
      </div>

      <form className="tc__form" onSubmit={handleSubmit}>
        <div className="tc__field">
          <label className="tc__label">Topics</label>
          <div className="tc__chips">
            {topics.map(t => (
              <span key={t} className="tc__chip">
                {t}
                <button type="button" className="tc__chip-remove" onClick={() => removeTopic(t)}>&times;</button>
              </span>
            ))}
            <input
              className="tc__chip-input"
              value={topicInput}
              onChange={e => setTopicInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={topics.length === 0 ? 'Type a topic and press Enter...' : 'Add more...'}
            />
          </div>
          {topicInput && filteredSuggestions.length > 0 && (
            <div className="tc__suggestions">
              {filteredSuggestions.slice(0, 6).map(s => (
                <button key={s} type="button" className="tc__suggestion" onClick={() => addTopic(s)}>
                  {s}
                </button>
              ))}
            </div>
          )}
          {topics.length === 0 && (
            <div className="tc__quick-add">
              <span className="tc__quick-label">Quick add:</span>
              {SUGGESTED_TOPICS.slice(0, 6).map(t => (
                <button key={t} type="button" className="tc__quick-btn" onClick={() => addTopic(t)}>
                  + {t}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tc__row">
          <div className="tc__field">
            <label className="tc__label">Difficulty</label>
            <div className="tc__toggle-group">
              {['easy', 'medium', 'hard'].map(d => (
                <button
                  key={d}
                  type="button"
                  className={`tc__toggle ${difficulty === d ? 'tc__toggle--active' : ''}`}
                  onClick={() => setDifficulty(d)}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="tc__field">
            <label className="tc__label">Number of Questions</label>
            <select
              className="tc__select"
              value={numQuestions}
              onChange={e => setNumQuestions(Number(e.target.value))}
            >
              {[5, 10, 15, 20, 25, 30].map(n => (
                <option key={n} value={n}>{n} questions</option>
              ))}
            </select>
          </div>
        </div>

        <div className="tc__field">
          <label className="tc__label">Question Type</label>
          <div className="tc__toggle-group">
            <button
              type="button"
              className={`tc__toggle ${questionType === 'mcq' ? 'tc__toggle--active' : ''}`}
              onClick={() => setQuestionType('mcq')}
            >
              MCQ (Single Answer)
            </button>
            <button
              type="button"
              className={`tc__toggle ${questionType === 'multi-select' ? 'tc__toggle--active' : ''}`}
              onClick={() => setQuestionType('multi-select')}
            >
              Multi-Select
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="tc__submit btn btn--primary"
          disabled={topics.length === 0 || loading}
        >
          {loading ? (
            <>
              <span className="tc__spinner" />
              Generating Test...
            </>
          ) : (
            'Generate Test \u2192'
          )}
        </button>
      </form>
    </div>
  );
}

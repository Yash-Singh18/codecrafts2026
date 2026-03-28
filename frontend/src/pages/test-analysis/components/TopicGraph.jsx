import { useState } from 'react';

function getColor(accuracy) {
  if (accuracy >= 80) return '#22c55e';
  if (accuracy >= 60) return '#eab308';
  if (accuracy >= 40) return '#f59e0b';
  return '#ef4444';
}

function getGlow(accuracy) {
  if (accuracy >= 80) return 'rgba(34, 197, 94, 0.4)';
  if (accuracy >= 60) return 'rgba(234, 179, 8, 0.3)';
  if (accuracy >= 40) return 'rgba(245, 158, 11, 0.3)';
  return 'rgba(239, 68, 68, 0.4)';
}

export default function TopicGraph({ topicPerformance, onSelectTopic, selectedTopic }) {
  const topics = Object.entries(topicPerformance);
  if (topics.length === 0) return null;

  const cx = 300, cy = 280, radius = 180;

  return (
    <div className="tg">
      <h3 className="tg__title">Knowledge Graph</h3>
      <p className="tg__subtitle">Click a topic node to see detailed performance</p>

      <div className="tg__canvas">
        <svg viewBox="0 0 600 560" className="tg__svg">
          {/* Lines from center to each topic */}
          {topics.map(([topic, data], i) => {
            const angle = (2 * Math.PI * i) / topics.length - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            return (
              <line
                key={`line-${topic}`}
                x1={cx} y1={cy} x2={x} y2={y}
                stroke={getColor(data.accuracy)}
                strokeWidth="2"
                strokeDasharray="6 4"
                opacity="0.4"
              />
            );
          })}

          {/* Center hub */}
          <circle cx={cx} cy={cy} r="36" fill="var(--color-surface)" stroke="var(--color-accent)" strokeWidth="2.5" />
          <text x={cx} y={cy - 6} textAnchor="middle" fill="var(--color-text-primary)" fontSize="11" fontWeight="700">Your</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="var(--color-text-primary)" fontSize="11" fontWeight="700">Score</text>

          {/* Topic nodes */}
          {topics.map(([topic, data], i) => {
            const angle = (2 * Math.PI * i) / topics.length - Math.PI / 2;
            const x = cx + radius * Math.cos(angle);
            const y = cy + radius * Math.sin(angle);
            const color = getColor(data.accuracy);
            const isSelected = selectedTopic === topic;

            return (
              <g
                key={topic}
                className="tg__node"
                onClick={() => onSelectTopic(isSelected ? null : topic)}
                style={{ cursor: 'pointer' }}
              >
                {/* Glow */}
                <circle cx={x} cy={y} r={isSelected ? 50 : 44} fill={getGlow(data.accuracy)} opacity={isSelected ? 1 : 0.5}>
                  <animate attributeName="r" values={isSelected ? '48;52;48' : '42;46;42'} dur="3s" repeatCount="indefinite" />
                </circle>

                {/* Node circle */}
                <circle
                  cx={x} cy={y} r="38"
                  fill="var(--color-surface)"
                  stroke={color}
                  strokeWidth={isSelected ? '3.5' : '2.5'}
                />

                {/* Accuracy arc */}
                {(() => {
                  const r = 32;
                  const pct = data.accuracy / 100;
                  const endAngle = pct * 2 * Math.PI - Math.PI / 2;
                  const startAngle = -Math.PI / 2;
                  const largeArc = pct > 0.5 ? 1 : 0;
                  const sx = x + r * Math.cos(startAngle);
                  const sy = y + r * Math.sin(startAngle);
                  const ex = x + r * Math.cos(endAngle);
                  const ey = y + r * Math.sin(endAngle);
                  return (
                    <>
                      <circle cx={x} cy={y} r={r} fill="none" stroke="var(--color-border)" strokeWidth="3" opacity="0.3" />
                      {pct > 0 && (
                        <path
                          d={`M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`}
                          fill="none" stroke={color} strokeWidth="3" strokeLinecap="round"
                        />
                      )}
                    </>
                  );
                })()}

                {/* Topic name */}
                <text x={x} y={y - 6} textAnchor="middle" fill="var(--color-text-primary)" fontSize="10" fontWeight="600">
                  {topic.length > 12 ? topic.slice(0, 11) + '...' : topic}
                </text>
                {/* Accuracy % */}
                <text x={x} y={y + 10} textAnchor="middle" fill={color} fontSize="13" fontWeight="800">
                  {Math.round(data.accuracy)}%
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Detail panel */}
      {selectedTopic && topicPerformance[selectedTopic] && (
        <TopicDetail
          topic={selectedTopic}
          data={topicPerformance[selectedTopic]}
          onClose={() => onSelectTopic(null)}
        />
      )}
    </div>
  );
}

function TopicDetail({ topic, data, onClose }) {
  return (
    <div className="tg__detail">
      <div className="tg__detail-header">
        <h4>{topic} - Detailed Breakdown</h4>
        <button className="tg__detail-close" onClick={onClose}>&times;</button>
      </div>

      <div className="tg__detail-stats">
        <div className="tg__detail-stat">
          <span className="tg__detail-stat-value" style={{ color: getColor(data.accuracy) }}>
            {Math.round(data.accuracy)}%
          </span>
          <span className="tg__detail-stat-label">Accuracy</span>
        </div>
        <div className="tg__detail-stat">
          <span className="tg__detail-stat-value">{data.correct_count}/{data.total_questions}</span>
          <span className="tg__detail-stat-label">Correct</span>
        </div>
        <div className="tg__detail-stat">
          <span className="tg__detail-stat-value">{data.avg_time}s</span>
          <span className="tg__detail-stat-label">Avg Time</span>
        </div>
        <div className="tg__detail-stat">
          <span className="tg__detail-stat-value">{data.time_ratio}x</span>
          <span className="tg__detail-stat-label">vs Expected</span>
        </div>
      </div>

      <div className="tg__detail-questions">
        <h5>Questions</h5>
        {data.questions.map((q, i) => (
          <div key={i} className={`tg__detail-q ${q.correct ? 'tg__detail-q--correct' : 'tg__detail-q--wrong'}`}>
            <div className="tg__detail-q-header">
              <span className={`tg__detail-q-status ${q.correct ? '' : 'tg__detail-q-status--wrong'}`}>
                {q.correct ? '\u2713' : '\u2717'}
              </span>
              <span className="tg__detail-q-subtopic">{q.subtopic}</span>
              <span className="tg__detail-q-time">{q.time_taken}s / {q.expected_time}s</span>
            </div>
            <p className="tg__detail-q-text">{q.question}</p>
            {!q.correct && (
              <div className="tg__detail-q-explanation">
                <p><strong>Your answer:</strong> {q.selected}</p>
                <p><strong>Correct:</strong> {q.correct_answer}</p>
                <p><strong>Explanation:</strong> {q.explanation}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

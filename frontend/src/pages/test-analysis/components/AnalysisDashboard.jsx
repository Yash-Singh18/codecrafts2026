import { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  PieChart, Pie, Cell,
} from 'recharts';
import TopicGraph from './TopicGraph';

const CHART_COLORS = ['#818cf8', '#22c55e', '#f59e0b', '#ef4444', '#06b6d4', '#a855f7', '#ec4899', '#14b8a6'];

function getScoreColor(score) {
  if (score >= 80) return '#22c55e';
  if (score >= 60) return '#eab308';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

export default function AnalysisDashboard({ questions, answers, analysis }) {
  const [selectedTopic, setSelectedTopic] = useState(null);
  const { overall, topic_performance, weaknesses } = analysis;

  const topicBarData = Object.entries(topic_performance).map(([topic, data]) => ({
    topic,
    accuracy: data.accuracy,
    avgTime: data.avg_time,
    expectedTime: data.avg_expected_time,
  }));

  const radarData = Object.entries(topic_performance).map(([topic, data]) => ({
    topic,
    accuracy: data.accuracy,
    timeEfficiency: Math.min(100, Math.round((data.avg_expected_time / Math.max(data.avg_time, 1)) * 100)),
  }));

  const pieData = [
    { name: 'Correct', value: overall.correct, color: getScoreColor(overall.score) },
    { name: 'Incorrect', value: overall.total - overall.correct, color: 'rgba(255, 255, 255, 0.1)' }
  ];

  const timeData = questions.map((q, i) => {
    const ans = answers.find(a => a.question_index === i);
    return {
      name: `Q${i + 1}`,
      timeTaken: ans ? ans.time_taken : 0,
      expectedTime: q.expected_time_seconds,
      correct: ans ? ans.correct : false,
    };
  });

  const totalTime = overall.total_time;
  const minutes = Math.floor(totalTime / 60);
  const seconds = totalTime % 60;

  return (
    <div className="ad">
      {/* Summary cards */}
      <div className="ad__summary">
        <div className="ad__card ad__card--score">
          <div className="ad__card-value" style={{ color: getScoreColor(overall.score) }}>
            {overall.score}%
          </div>
          <div className="ad__card-label">Overall Score</div>
        </div>
        <div className="ad__card">
          <div className="ad__card-value">{overall.correct}/{overall.total}</div>
          <div className="ad__card-label">Correct Answers</div>
        </div>
        <div className="ad__card">
          <div className="ad__card-value">{minutes}m {seconds}s</div>
          <div className="ad__card-label">Total Time</div>
        </div>
        <div className="ad__card">
          <div className="ad__card-value">{weaknesses.length}</div>
          <div className="ad__card-label">Weak Areas</div>
        </div>
      </div>

      {/* Weakness alerts */}
      {weaknesses.length > 0 && (
        <div className="ad__weaknesses">
          <h3 className="ad__section-title">Areas Needing Attention</h3>
          <div className="ad__weakness-list">
            {weaknesses.map((w, i) => (
              <div key={i} className={`ad__weakness ad__weakness--${w.severity}`}>
                <span className="ad__weakness-topic">{w.topic}</span>
                <div className="ad__weakness-reasons">
                  {w.reasons.map((r, j) => (
                    <span key={j} className="ad__weakness-reason">{r}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Row: Pie Chart & Topic Accuracy Bar */}
      <div className="ad__charts ad__charts--top">
        <div className="ad__chart-card ad__chart-card--pie">
          <h3 className="ad__section-title">Overall Accuracy</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px'
                }}
                itemStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '4px' }}
              />
               <Legend verticalAlign="bottom" height={36} wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}/>
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="ad__chart-card ad__chart-card--bar">
          <h3 className="ad__section-title">Topic-wise Accuracy</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topicBarData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="topic" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: 'var(--color-accent-light)', opacity: 0.2 }}
                contentStyle={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px'
                }}
                itemStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '4px' }}
              />
              <Bar dataKey="accuracy" name="Accuracy %" radius={[6, 6, 0, 0]}>
                {topicBarData.map((entry, i) => (
                  <Cell key={i} fill={getScoreColor(entry.accuracy)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row: Radar & Time Analysis */}
      <div className="ad__charts">
        <div className="ad__chart-card">
          <h3 className="ad__section-title">Skill Radar</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--color-border)" />
              <PolarAngleAxis dataKey="topic" tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} />
              <PolarRadiusAxis domain={[0, 100]} tick={{ fill: 'var(--color-text-secondary)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Radar name="Accuracy" dataKey="accuracy" stroke="#818cf8" fill="#818cf8" fillOpacity={0.3} />
              <Radar name="Time Efficiency" dataKey="timeEfficiency" stroke="#22c55e" fill="#22c55e" fillOpacity={0.2} />
              <Tooltip
                contentStyle={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px'
                }}
                itemStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '11px' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="ad__chart-card">
          <h3 className="ad__section-title">Time Analysis (per Q)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fill: 'var(--color-text-secondary)', fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip
                cursor={{ fill: 'var(--color-accent-light)', opacity: 0.2 }}
                contentStyle={{
                  background: 'var(--color-bg)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-lg)',
                  padding: '12px'
                }}
                itemStyle={{ color: 'var(--color-text-primary)', fontWeight: '600' }}
                labelStyle={{ color: 'var(--color-text-secondary)', fontWeight: '700', marginBottom: '4px' }}
              />
              <Legend wrapperStyle={{ color: 'var(--color-text-secondary)', fontSize: '11px', paddingTop: '10px' }} />
              <Bar dataKey="timeTaken" name="Your Time" radius={[4, 4, 0, 0]}>
                {timeData.map((entry, i) => (
                   <Cell key={i} fill={entry.correct ? '#818cf8' : '#ef4444'} opacity={0.85} />
                ))}
              </Bar>
              <Bar dataKey="expectedTime" name="Expected" fill="var(--color-text-secondary)" radius={[4, 4, 0, 0]} opacity={0.4} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Topic Graph */}
      <TopicGraph
        topicPerformance={topic_performance}
        onSelectTopic={setSelectedTopic}
        selectedTopic={selectedTopic}
        overallScore={overall.score}
      />
    </div>
  );
}

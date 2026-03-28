export default function AIReport({ report, loading }) {
  if (loading) {
    return (
      <div className="ar">
        <div className="ar__loading">
          <div className="ar__loading-icon">
            <span className="tc__spinner" />
          </div>
          <h3>Generating AI Report...</h3>
          <p>Our AI is analyzing your performance and preparing personalized recommendations</p>
        </div>
      </div>
    );
  }

  if (!report) return null;

  return (
    <div className="ar">
      <div className="ar__header">
        <div className="ar__badge">AI-Powered Report</div>
        <h2 className="ar__title">Performance Report</h2>
      </div>

      {/* Overall Assessment */}
      {report.overall_assessment && (
        <div className="ar__section ar__section--highlight">
          <h3 className="ar__section-title">Overall Assessment</h3>
          <p className="ar__assessment">{report.overall_assessment}</p>
        </div>
      )}

      <div className="ar__grid">
        {/* Strengths */}
        {report.strengths && report.strengths.length > 0 && (
          <div className="ar__section ar__section--strengths">
            <h3 className="ar__section-title">Strengths</h3>
            <ul className="ar__list">
              {report.strengths.map((s, i) => (
                <li key={i} className="ar__list-item ar__list-item--success">{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Weaknesses */}
        {report.weaknesses && report.weaknesses.length > 0 && (
          <div className="ar__section ar__section--weaknesses">
            <h3 className="ar__section-title">Areas to Improve</h3>
            <div className="ar__weakness-cards">
              {report.weaknesses.map((w, i) => (
                <div key={i} className={`ar__weakness-card ar__weakness-card--${w.severity || 'medium'}`}>
                  <div className="ar__weakness-card-topic">{w.topic}</div>
                  <p className="ar__weakness-card-reason">{w.reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Time Analysis */}
      {report.time_analysis && (
        <div className="ar__section">
          <h3 className="ar__section-title">Time Management</h3>
          <p className="ar__time-text">{report.time_analysis}</p>
        </div>
      )}

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <div className="ar__section">
          <h3 className="ar__section-title">Study Recommendations</h3>
          <div className="ar__recommendations">
            {report.recommendations.map((rec, i) => (
              <div key={i} className="ar__rec-card">
                <h4 className="ar__rec-title">{rec.title}</h4>
                <p className="ar__rec-desc">{rec.description}</p>
                {rec.resources && rec.resources.length > 0 && (
                  <div className="ar__rec-resources">
                    <span className="ar__rec-resources-label">Resources:</span>
                    <ul>
                      {rec.resources.map((r, j) => (
                        <li key={j} className="ar__rec-resource">{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Items */}
      {report.action_items && report.action_items.length > 0 && (
        <div className="ar__section ar__section--actions">
          <h3 className="ar__section-title">Priority Action Items</h3>
          <ol className="ar__action-list">
            {report.action_items.map((item, i) => (
              <li key={i} className="ar__action-item">{item}</li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

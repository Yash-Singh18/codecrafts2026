const API_URL = import.meta.env.VITE_TEST_ANALYSIS_API_URL || '';

export const testAnalysisService = {
  async generateTest(config) {
    const res = await fetch(`${API_URL}/api/generate-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate test');
    }
    return res.json();
  },

  async analyzeTest(questions, answers) {
    const res = await fetch(`${API_URL}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to analyze test');
    }
    return res.json();
  },

  async generateReport(questions, answers, analysis) {
    const res = await fetch(`${API_URL}/api/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questions, answers, analysis }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to generate report');
    }
    return res.json();
  },
};

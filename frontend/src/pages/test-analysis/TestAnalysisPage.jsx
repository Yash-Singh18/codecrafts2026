import { useState } from 'react';
import { testAnalysisService } from '../../services/testAnalysis/testAnalysisService';
import { testAttemptService } from '../../services/testAnalysis/testAttemptService';
import TestConfig from './components/TestConfig';
import TestEngine from './components/TestEngine';
import AnalysisDashboard from './components/AnalysisDashboard';
import AIReport from './components/AIReport';
import ChatPanel from './components/ChatPanel';
import './TestAnalysisPage.css';

const PHASE = {
  CONFIG: 'config',
  GENERATING: 'generating',
  TEST: 'test',
  ANALYZING: 'analyzing',
  RESULTS: 'results',
};

export default function TestAnalysisPage({ user }) {
  const [phase, setPhase] = useState(PHASE.CONFIG);
  const [config, setConfig] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showTutor, setShowTutor] = useState(true);

  const handleStartTest = async (cfg) => {
    setConfig(cfg);
    setPhase(PHASE.GENERATING);
    setError(null);
    try {
      const data = await testAnalysisService.generateTest(cfg);
      setQuestions(data.questions);
      setPhase(PHASE.TEST);
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.CONFIG);
    }
  };

  const handleTestComplete = async (results) => {
    setAnswers(results);
    setPhase(PHASE.ANALYZING);
    setError(null);
    try {
      const analysisData = await testAnalysisService.analyzeTest(questions, results);
      setAnalysis(analysisData);
      setPhase(PHASE.RESULTS);

      // Fetch AI report in background
      setReportLoading(true);
      let reportData = null;
      try {
        const res = await testAnalysisService.generateReport(questions, results, analysisData);
        reportData = res.report;
        setReport(reportData);
      } catch {
        // report is optional
      } finally {
        setReportLoading(false);
      }

      // Save attempt to Supabase if logged in
      if (user) {
        try {
          await testAttemptService.saveAttempt({
            userId: user.id,
            config,
            questions,
            answers: results,
            analysis: analysisData,
            report: reportData,
          });
        } catch {
          // Saving is non-blocking
        }
      }
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.CONFIG);
    }
  };

  const handleRetake = () => {
    setPhase(PHASE.CONFIG);
    setConfig(null);
    setQuestions([]);
    setAnswers([]);
    setAnalysis(null);
    setReport(null);
    setError(null);
    setShowTutor(true);
  };

  return (
    <div className={`ta-page ${phase === PHASE.RESULTS ? 'ta-page--results' : ''}`.trim()}>
      {error && (
        <div className="ta-error">
          <span>{error}</span>
          <button className="ta-error__close" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {phase === PHASE.CONFIG && <TestConfig onStart={handleStartTest} loading={false} />}

      {phase === PHASE.GENERATING && (
        <div className="ta-loading">
          <div className="ta-loading__content">
            <div className="ta-loading__spinner" />
            <h2>Generating Your Test</h2>
            <p>Our AI is crafting personalized questions based on your selection...</p>
            <div className="ta-loading__steps">
              <div className="ta-loading__step ta-loading__step--active">Creating questions with LLaMA 70B</div>
              <div className="ta-loading__step">Validating question quality</div>
              <div className="ta-loading__step">Preparing test engine</div>
            </div>
          </div>
        </div>
      )}

      {phase === PHASE.TEST && <TestEngine questions={questions} onComplete={handleTestComplete} />}

      {phase === PHASE.ANALYZING && (
        <div className="ta-loading">
          <div className="ta-loading__content">
            <div className="ta-loading__spinner" />
            <h2>Analyzing Your Performance</h2>
            <p>Running rule-based analysis and AI-powered insights...</p>
          </div>
        </div>
      )}

      {phase === PHASE.RESULTS && analysis && (
        <div className="ta-results">
          <div className="ta-results__header">
            <h1>Test Analysis Results</h1>
            <div className="ta-results__header-actions">
              {user && <span className="ta-saved-badge">Saved to your profile</span>}
              <button className="btn btn--ghost" onClick={() => setShowTutor(prev => !prev)}>
                {showTutor ? 'Hide AI Tutor' : 'Show AI Tutor'}
              </button>
              <button className="btn btn--ghost" onClick={handleRetake}>Take Another Test</button>
            </div>
          </div>
          <div className={`ta-results__layout ${showTutor ? '' : 'ta-results__layout--wide'}`.trim()}>
            <div className="ta-results__main">
              <AnalysisDashboard questions={questions} answers={answers} analysis={analysis} />
              <AIReport report={report} loading={reportLoading} />
            </div>
            {showTutor && (
              <aside className="ta-results__sidebar">
                <ChatPanel
                  className="ic--sidebar"
                  questions={questions}
                  answers={answers}
                  analysis={analysis}
                  report={report}
                />
              </aside>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

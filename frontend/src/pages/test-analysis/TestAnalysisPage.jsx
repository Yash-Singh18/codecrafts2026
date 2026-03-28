import { useState } from 'react';
import { testAnalysisService } from '../../services/testAnalysis/testAnalysisService';
import TestConfig from './components/TestConfig';
import TestEngine from './components/TestEngine';
import AnalysisDashboard from './components/AnalysisDashboard';
import AIReport from './components/AIReport';
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
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleStartTest = async (config) => {
    setPhase(PHASE.GENERATING);
    setError(null);
    try {
      const data = await testAnalysisService.generateTest(config);
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
      try {
        const reportData = await testAnalysisService.generateReport(questions, results, analysisData);
        setReport(reportData.report);
      } catch {
        // Report is optional, don't block results
      } finally {
        setReportLoading(false);
      }
    } catch (err) {
      setError(err.message);
      setPhase(PHASE.CONFIG);
    }
  };

  const handleRetake = () => {
    setPhase(PHASE.CONFIG);
    setQuestions([]);
    setAnswers([]);
    setAnalysis(null);
    setReport(null);
    setError(null);
  };

  return (
    <div className="ta-page">
      {error && (
        <div className="ta-error">
          <span>{error}</span>
          <button className="ta-error__close" onClick={() => setError(null)}>&times;</button>
        </div>
      )}

      {phase === PHASE.CONFIG && (
        <TestConfig onStart={handleStartTest} loading={false} />
      )}

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

      {phase === PHASE.TEST && (
        <TestEngine questions={questions} onComplete={handleTestComplete} />
      )}

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
            <button className="btn btn--ghost" onClick={handleRetake}>
              Take Another Test
            </button>
          </div>
          <AnalysisDashboard
            questions={questions}
            answers={answers}
            analysis={analysis}
          />
          <AIReport report={report} loading={reportLoading} />
        </div>
      )}
    </div>
  );
}

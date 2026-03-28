import { Link } from 'react-router-dom';
import './HomePage.css';

const GoogleIcon = () => (
  <svg className="btn-google__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

function HeroSection({ user, onLogin, actionLoading }) {
  return (
    <section className="hero" id="hero">
      <div className="hero__content">
        <div className="hero__badge">AI-Powered Study Assistant</div>
        <h1 className="hero__title">
          Master Your Exams.<br />
          <span className="hero__title--accent">Learn Smarter.</span>
        </h1>
        <p className="hero__subtitle">
          CodeCrafts is your personalized AI tutor. We analyze your preparation, identify weak spots,
          and provide targeted practice so you can ace your next test.
        </p>
        <div className="hero__actions">
          {user ? (
            <Link to="/test-analysis" className="btn btn--primary">Start Test Analysis &rarr;</Link>
          ) : (
            <button className="btn btn--primary" onClick={onLogin} disabled={actionLoading}>
              <GoogleIcon />
              {actionLoading ? 'Redirecting...' : 'Start Practicing for Free'}
            </button>
          )}
          <a href="#about" className="btn btn--ghost">How it works</a>
        </div>
      </div>

      <div className="hero__visual" aria-hidden="true">
        <div className="hero__glow" />
        <div className="hero__code-window">
          <div className="hero__code-window-bar">
            <span /><span /><span />
          </div>
          <div className="hero__analysis-preview">
            <div className="analysis-header">
              <span className="analysis-title">Physics 101 - Mock Test Results</span>
              <span className="analysis-score">82%</span>
            </div>
            <div className="analysis-body">
              <p className="analysis-text analysis-text--success">&#10003; Great understanding of Kinematics.</p>
              <p className="analysis-text analysis-text--warning">! Needs review: Thermodynamics laws.</p>
              <div className="analysis-ai-box">
                <span className="ai-box-badge">AI Recommendation</span>
                <p>You struggled with entropy calculations. I've generated 3 practice problems focusing on the Second Law of Thermodynamics. Ready to practice?</p>
                <button className="ai-box-btn">Start Targeted Practice &rarr;</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="hero__scroll-hint">
        <span>Scroll to explore</span>
        <div className="hero__scroll-arrow">&darr;</div>
      </div>
    </section>
  );
}

function AboutSection() {
  const cards = [
    { icon: '\uD83C\uDFAF', title: 'Targeted Practice', desc: 'Stop wasting time on what you already know. Our AI pinpoints exactly where you need improvement.' },
    { icon: '\uD83D\uDCCA', title: 'Deep Analytics', desc: 'Visualize your progress over time with detailed charts breaking down performance by topic and difficulty.' },
    { icon: '\uD83E\uDD16', title: 'Instant Explanations', desc: 'Stuck on a problem? Get step-by-step AI explanations that teach you the concept, not just the answer.' },
    { icon: '\uD83D\uDCDA', title: 'Custom Mock Tests', desc: 'Generate unlimited practice exams tailored specifically to your syllabus and upcoming test formats.' },
  ];

  return (
    <section className="about" id="about">
      <div className="about__container">
        <div className="about__header">
          <span className="about__eyebrow">Why CodeCrafts?</span>
          <h2 className="about__title">Everything you need to test your preparation</h2>
          <p className="about__subtitle">
            We combine advanced LLMs with proven pedagogical techniques to create a study
            environment that adapts to your unique learning style.
          </p>
        </div>
        <div className="about__cards">
          {cards.map((card, idx) => (
            <div key={card.title} className="about__card" style={{ '--animation-order': idx }}>
              <div className="about__card-icon-wrapper">
                <span className="about__card-icon">{card.icon}</span>
              </div>
              <h3 className="about__card-title">{card.title}</h3>
              <p className="about__card-desc">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer__inner">
        <div className="footer__brand">
          <span className="navbar__logo-icon">&#x2B21;</span>
          <span className="footer__brand-name">CodeCrafts</span>
        </div>
        <p className="footer__tagline">The ultimate AI preparation tool for students.</p>
        <p className="footer__copy">&copy; {new Date().getFullYear()} CodeCrafts. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function HomePage({ user, onLogin, actionLoading }) {
  return (
    <>
      <HeroSection user={user} onLogin={onLogin} actionLoading={actionLoading} />
      <AboutSection />
      <Footer />
    </>
  );
}

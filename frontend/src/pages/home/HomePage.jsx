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
      <div className="hero__background-light" />
      <div className="hero__content">
        <div className="hero__badge">AI-Powered Study Assistant</div>
        <h1 className="hero__title">
          Master Your Exams.<br />
          <span className="hero__title--accent">Learn Smarter.</span>
        </h1>
        <p className="hero__subtitle">
          Rigel is your personalized AI tutor. We analyze your preparation, identify weak spots,
          and provide targeted practice so you can ace your next test.
        </p>
        <div className="hero__actions">
          {user ? (
            <Link to="/test-analysis" className="btn btn--primary btn--large">Start Test Analysis &rarr;</Link>
          ) : (
            <button className="btn btn--primary btn--large" onClick={onLogin} disabled={actionLoading}>
              <GoogleIcon />
              {actionLoading ? 'Redirecting...' : 'Start Practicing for Free'}
            </button>
          )}
          <a href="#features" className="btn btn--ghost btn--large">Explore Features</a>
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

function FeaturesSection() {
  const cards = [
    { icon: '💬', title: 'Community', desc: 'Connect with peers, share resources, and learn collaboratively through discussions.', link: '/community' },
    { icon: '📊', title: 'Test Analysis', desc: 'Analyze mock tests, identify your weak areas, and track your progress visually.', link: '/test-analysis' },
    { icon: '🎯', title: 'FocusZone', desc: 'Use AI to generate personalized logic maps and keep your study strictly targeted.', link: '/focus-zone' },
    { icon: '🚀', title: 'Career Guide', desc: 'Explore diverse career domains and get AI-generated roadmaps for your future.', link: '/career-guide' },
  ];

  return (
    <section className="features" id="features">
      <div className="features__container">
        <div className="features__header">
          <span className="features__eyebrow">Platform Features</span>
          <h2 className="features__title">Everything you need to succeed</h2>
          <p className="features__subtitle">
            Seamlessly jump into our dedicated modules to supercharge your preparation.
          </p>
        </div>
        <div className="features__cards">
          {cards.map((card, idx) => (
            <Link to={card.link} key={card.title} className="features__card" style={{ '--animation-order': idx }}>
              <div className="features__card-icon-wrapper">
                <span className="features__card-icon">{card.icon}</span>
              </div>
              <h3 className="features__card-title">{card.title}</h3>
              <p className="features__card-desc">{card.desc}</p>
              <span className="features__card-action">Explore {card.title} &rarr;</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutUsSection() {
  return (
    <section className="about-us" id="about">
      <div className="about-us__container">
        <div className="about-us__content">
          <span className="about-us__eyebrow">Our Mission</span>
          <h2 className="about-us__title">Empowering the next generation of learners</h2>
          <p className="about-us__desc">
            Rigel was built on the belief that education should be personalized. Every student has unique strengths and weaknesses that traditional classrooms can't always address. By leveraging cutting-edge Artificial Intelligence, we bridge that gap.
          </p>
          <p className="about-us__desc">
            We combine advanced LLMs with proven pedagogical techniques to create a study environment that adapts instantly to your needs. From deep test analytics to real-time doubt resolution and structured career roadmapping, we are dedicated to helping you achieve your true potential.
          </p>
          <div className="about-us__stats">
            <div className="stat-box">
              <span className="stat-num">50k+</span>
              <span className="stat-label">Students Guided</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">2M+</span>
              <span className="stat-label">Questions Analyzed</span>
            </div>
            <div className="stat-box">
              <span className="stat-num">99%</span>
              <span className="stat-label">Satisfaction Rate</span>
            </div>
          </div>
        </div>
        <div className="about-us__visual">
          <div className="about-us__image-placeholder">
            <div className="about-us__glow" />
            <span className="about-us__logo-icon">&#x2B21;</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ReviewsSection() {
  const reviews = [
    { name: "Sarah J.", role: "Engineering Student", text: "The Test Analysis completely changed how I study. I stopped wasting time on topics I knew and focused purely on my weaknesses.", rating: 5 },
    { name: "Michael T.", role: "High School Senior", text: "FocusZone kept me from getting distracted. The AI generated logic maps broke down huge syllabus chapters into bite-sized tasks.", rating: 5 },
    { name: "Priya R.", role: "Medical Aspirant", text: "The Career Guide roadmaps are insanely detailed. It told me exactly what exams to prepare for and when. Highly recommended!", rating: 4 },
  ];

  return (
    <section className="reviews" id="reviews">
      <div className="reviews__container">
        <div className="reviews__header">
          <h2 className="reviews__title">Loved by students nationwide</h2>
          <p className="reviews__subtitle">See how Rigel is transforming exam preparation.</p>
        </div>
        <div className="reviews__grid">
          {reviews.map((r, i) => (
            <div key={i} className="review-card">
              <div className="review-card__stars">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <span key={idx} className={idx < r.rating ? "star filled" : "star"}>&#9733;</span>
                ))}
              </div>
              <p className="review-card__text">"{r.text}"</p>
              <div className="review-card__author">
                <div className="author-avatar">{r.name.charAt(0)}</div>
                <div className="author-info">
                  <span className="author-name">{r.name}</span>
                  <span className="author-role">{r.role}</span>
                </div>
              </div>
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
          <span className="footer__brand-name">Rigel</span>
        </div>
        <p className="footer__tagline">The ultimate AI preparation tool for students.</p>
        <div className="footer__links">
          <a href="#features">Features</a>
          <a href="#about">About</a>
          <a href="#reviews">Reviews</a>
        </div>
        <p className="footer__copy">&copy; {new Date().getFullYear()} Rigel. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default function HomePage({ user, onLogin, actionLoading }) {
  return (
    <div className="homepage-wrapper">
      <HeroSection user={user} onLogin={onLogin} actionLoading={actionLoading} />
      <FeaturesSection />
      <AboutUsSection />
      <ReviewsSection />
      <Footer />
    </div>
  );
}

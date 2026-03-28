import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const GoogleIcon = () => (
  <svg className="btn-google__icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function Navbar({ user, profile, onLogin, onSignOut, actionLoading, theme, toggleTheme }) {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner">
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">&#x2B21;</span>
          <span className="navbar__logo-text">CodeCrafts</span>
        </Link>

        <div className="navbar__links">
          <Link
            to="/community"
            className={`navbar__link ${location.pathname.startsWith('/community') ? 'navbar__link--active' : ''}`}
          >
            Community
          </Link>
          <Link
            to="/test-analysis"
            className={`navbar__link ${location.pathname === '/test-analysis' ? 'navbar__link--active' : ''}`}
          >
            Test Analysis
          </Link>
          <Link
            to="/focus-zone"
            className={`navbar__link ${location.pathname === '/focus-zone' ? 'navbar__link--active' : ''}`}
          >
            FocusZone
          </Link>
          <Link
            to="/career-guide"
            className={`navbar__link ${location.pathname === '/career-guide' ? 'navbar__link--active' : ''}`}
          >
            Career Guide
          </Link>
        </div>

        <div className="navbar__actions">
          <button onClick={toggleTheme} className="navbar__theme-toggle" aria-label="Toggle theme">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <div className="navbar__auth">
              <Link to="/profile" className="navbar__user-name">
                {profile?.username ? `@${profile.username}` : user.email}
              </Link>
              <button
                className="navbar__btn navbar__btn--outline"
                onClick={onSignOut}
                disabled={actionLoading}
              >
                {actionLoading ? 'Signing out...' : 'Sign out'}
              </button>
            </div>
          ) : (
            <button
              className="navbar__btn navbar__btn--primary"
              onClick={onLogin}
              disabled={actionLoading}
            >
              <GoogleIcon />
              {actionLoading ? 'Redirecting...' : 'Login'}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from './services/supabase/authService';
import Navbar from './components/Navbar/Navbar';
import HomePage from './pages/home/HomePage';
import TestAnalysisPage from './pages/test-analysis/TestAnalysisPage';

export default function App() {
  const [user, setUser] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => (prev === 'light' ? 'dark' : 'light'));

  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await authService.getSession();
        setUser(session?.user ?? null);
      } catch {
        setUser(null);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(session => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      setError(err.message || 'Failed to sign in.');
      setActionLoading(false);
    }
  };

  const handleSignOut = async () => {
    setActionLoading(true);
    setError(null);
    try {
      await authService.signOut();
    } catch (err) {
      setError(err.message || 'Failed to sign out.');
    } finally {
      setActionLoading(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar
        user={user}
        onLogin={handleGoogleLogin}
        onSignOut={handleSignOut}
        actionLoading={actionLoading}
        theme={theme}
        toggleTheme={toggleTheme}
      />
      {error && <p className="global-error">{error}</p>}
      <Routes>
        <Route
          path="/"
          element={<HomePage user={user} onLogin={handleGoogleLogin} actionLoading={actionLoading} />}
        />
        <Route path="/test-analysis" element={<TestAnalysisPage user={user} />} />
      </Routes>
    </BrowserRouter>
  );
}

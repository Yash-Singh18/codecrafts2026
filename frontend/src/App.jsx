import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { authService } from './services/supabase/authService';
import { profileService } from './services/supabase/profileService';
import Navbar from './components/Navbar/Navbar';
import ProfileSetupModal from './components/ProfileSetupModal/ProfileSetupModal';
import HomePage from './pages/home/HomePage';
import TestAnalysisPage from './pages/test-analysis/TestAnalysisPage';
import CommunityPage from './pages/community/CommunityPage';
import CommunityPostPage from './pages/community/CommunityPostPage';
import AuthCallbackPage from './pages/auth/AuthCallbackPage';
import FocusZonePage from './pages/focus-zone/FocusZonePage';
import ProfilePage from './pages/profile/ProfilePage';

export default function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
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
        const u = session?.user ?? null;
        setUser(u);
        if (u) {
          const p = await profileService.getProfile(u.id);
          if (p) {
            setProfile(p);
          } else {
            setShowProfileSetup(true);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setSessionLoading(false);
      }
    };

    loadSession();

    const {
      data: { subscription },
    } = authService.onAuthStateChange(async session => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        try {
          const p = await profileService.getProfile(u.id);
          if (p) {
            setProfile(p);
            setShowProfileSetup(false);
          } else {
            setShowProfileSetup(true);
          }
        } catch {
          // non-blocking
        }
      } else {
        setProfile(null);
        setShowProfileSetup(false);
      }
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

  const handleProfileComplete = (p) => {
    setProfile(p);
    setShowProfileSetup(false);
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
      {showProfileSetup && user && (
        <ProfileSetupModal user={user} onComplete={handleProfileComplete} />
      )}
      <Navbar
        user={user}
        profile={profile}
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
        <Route path="/community" element={<CommunityPage user={user} profile={profile} onLogin={handleGoogleLogin} />} />
        <Route path="/community/:postId" element={<CommunityPostPage user={user} profile={profile} onLogin={handleGoogleLogin} />} />
        <Route path="/focus-zone" element={<FocusZonePage />} />
        <Route path="/profile" element={<ProfilePage user={user} profile={profile} />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
      </Routes>
    </BrowserRouter>
  );
}

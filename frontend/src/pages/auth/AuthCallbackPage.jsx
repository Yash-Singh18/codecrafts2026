import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase/supabaseClient';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase client processes the hash/code from URL automatically.
    // Wait for it to fire onAuthStateChange, then go home.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        subscription.unsubscribe();
        navigate('/', { replace: true });
      }
    });

    // Fallback: if already signed in or no event fires within 3s, redirect anyway
    const fallback = setTimeout(() => navigate('/', { replace: true }), 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      flexDirection: 'column',
      gap: '1rem',
    }}>
      <div className="loading-spinner" />
      <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9rem' }}>
        Signing you in…
      </p>
    </div>
  );
}

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { supabase } from '../../lib/supabase';

export default function OAuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase client uses the URL hash to automatically generate the session on load
    // so we can get it from the client
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error || !session) {
        setError(error?.message || 'No token found or invalid session');
        return;
      }

      const accessToken = session.access_token;

      // verify and fetch profile
      axios
        .get('/api/auth/verify/', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        })
        .then((resp) => {
          const user = resp.data;
          // do not force a default role; keep it undefined if backend returns none
          if (user.role) {
            const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
            navigate(dest);
          } else {
            // tell the picker we came from OAuth so it can show explanatory text
            const params = new URLSearchParams();
            params.set('from', 'oauth');
            navigate('/select-role?' + params.toString());
          }
        })
        .catch((err) => {
          console.error(err);
          // If the profile verification fails after login, we shouldn't necessarily crash
          // the session itself is valid but they might not have a profile, we let AuthContext 
          // handle role selection and redirect it to home on error.
          navigate('/');
        });
    });
  }, [navigate]);

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="p-8 text-center bg-card shadow-lg rounded-xl flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
          </div>
          <h2 className="text-xl font-bold text-red-600 mb-2">Error de Autenticación</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="animate-pulse space-y-4 flex flex-col items-center">
        <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
        <p className="text-muted-foreground font-medium">Verificando sesión...</p>
      </div>
    </div>
  );
}

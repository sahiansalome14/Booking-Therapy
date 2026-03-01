import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      if (user.role) {
        const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
        navigate(dest);
      } else {
        navigate('/select-role');
      }
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-muted flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={["google", "github"]}
          redirectTo={window.location.origin + '/oauth-callback'}
          theme="dark"
        />
      </Card>
    </div>
  );
}

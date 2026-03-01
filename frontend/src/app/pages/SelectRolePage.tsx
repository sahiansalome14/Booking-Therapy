import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function SelectRolePage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const [role, setRole] = useState<'client' | 'therapist'>('client');
  const [searchParams] = useState(() => {
    try {
      return new URLSearchParams(window.location.search);
    } catch {
      return new URLSearchParams();
    }
  });

  // initialize role from query string if provided
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'therapist' || r === 'client') {
      setRole(r);
    }
  }, [searchParams]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const token = localStorage.getItem('access_token');
    if (!token) {
      setError('No hay token, vuelve a iniciar sesión');
      setLoading(false);
      return;
    }
    try {
      await axios.post(
        'http://localhost:8000/api/auth/set-role/',
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update global context state
      await refreshUser();

      const dest = role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
      navigate(dest, { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Error asignando rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-accent via-background to-muted">
      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center">Selecciona tu rol</h2>
        {searchParams.get('from') === 'oauth' && (
          <p className="text-sm text-center text-muted-foreground">
            Acabas de iniciar sesión con un proveedor externo. Por favor elige un rol para completar tu perfil.
          </p>
        )}
        <div className="flex gap-4 justify-center">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="client"
              checked={role === 'client'}
              onChange={() => setRole('client')}
              disabled={loading}
            />
            Cliente
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="role"
              value="therapist"
              checked={role === 'therapist'}
              onChange={() => setRole('therapist')}
              disabled={loading}
            />
            Terapeuta
          </label>
        </div>
        {error && <div className="text-red-600 text-center">{error}</div>}
        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? 'Guardando...' : 'Continuar'}
        </Button>
      </form>
    </div>
  );
}

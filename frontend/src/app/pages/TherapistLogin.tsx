import React from 'react';
import { Link } from 'react-router';
import { Sparkles } from 'lucide-react';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

export default function TherapistLogin() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-accent via-background to-muted flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold">Vis Vitalis</span>
          </div>
          <h2 className="text-2xl font-bold mb-2">Portal de Terapeutas</h2>
          <p className="text-muted-foreground">Accede a tu dashboard profesional</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <input
              type="email"
              defaultValue="carlos.mendez@email.com"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Contraseña</label>
            <input
              type="password"
              defaultValue="password123"
              className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
              placeholder="••••••••"
            />
          </div>

          <Link to="/therapist/dashboard" className="block">
            <Button className="w-full" size="lg">
              Iniciar Sesión
            </Button>
          </Link>

          <div className="text-center text-sm">
            <Link to="/" className="text-primary hover:underline">
              ¿Olvidaste tu contraseña?
            </Link>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-card text-muted-foreground">o</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            ¿Eres nuevo terapeuta?{' '}
            <Link to="/" className="text-primary hover:underline font-medium">
              Solicita acceso
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}

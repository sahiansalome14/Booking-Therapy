import React from 'react';
import { Link, useLocation } from 'react-router';
import { Sparkles, User, Zap } from 'lucide-react';
import { Button } from './Button';

export function Header() {
  const location = useLocation();
  const isTherapistDashboard = location.pathname.startsWith('/therapist');
  const isClientDashboard = location.pathname.startsWith('/client');
  
  return (
    <header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-300 group">
            <div className="relative">
              <Sparkles className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
              <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Vis Vitalis
            </span>
          </Link>
          
          <nav className="flex items-center gap-8">
            {!isTherapistDashboard && !isClientDashboard && (
              <>
                <Link 
                  to="/search" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
                >
                  Buscar Terapeutas
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link 
                  to="/therapist/login" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
                >
                  Soy Terapeuta
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
                </Link>
                <Link to="/client/login">
                  <Button variant="outline" size="sm">
                    Iniciar Sesión
                  </Button>
                </Link>
              </>
            )}
            {isClientDashboard && (
              <>
                <Link 
                  to="/search" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Buscar Terapeutas
                </Link>
                <Link 
                  to="/client/dashboard" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Mi Dashboard
                </Link>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  María González
                </Button>
              </>
            )}
            {isTherapistDashboard && (
              <>
                <Link 
                  to="/therapist/dashboard" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/therapist/schedule" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Agenda
                </Link>
                <Link 
                  to="/therapist/sessions" 
                  className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
                >
                  Sesiones
                </Link>
                <Button variant="ghost" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Dr. Carlos Méndez
                </Button>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}

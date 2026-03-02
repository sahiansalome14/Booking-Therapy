import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireAuth?: boolean;
    requireRole?: boolean;
}

export function ProtectedRoute({
    children,
    requireAuth = true,
    requireRole = true
}: ProtectedRouteProps) {
    const { user, isInitializing } = useAuth();
    const location = useLocation();

    if (isInitializing) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    <p className="text-muted-foreground font-medium">Cargando...</p>
                </div>
            </div>
        );
    }

    console.log('🛡️ ProtectedRoute Check:', {
        path: location.pathname,
        user: user ? { email: user.email, role: user.role } : 'null',
        requireAuth,
        requireRole
    });

    // No autenticado
    if (requireAuth && !user) {
        console.log('🛡️ ProtectedRoute: No user, redirecting to /');
        return <Navigate to="/" replace />;
    }

    // Estado autenticado pero verificando la integridad del perfil
    if (requireAuth && user) {
        // Si el perfil no está completo, forzar redirección a seleccionar-rol
        if (!user.is_profile_complete) {
            if (location.pathname !== '/seleccionar-rol' && location.pathname !== '/select-role') {
                console.log('🛡️ ProtectedRoute: Profile incomplete, redirecting to /seleccionar-rol');
                return <Navigate to="/seleccionar-rol" replace />;
            }
        }
        // Si el perfil ya está completo e intenta entrar a selección de rol
        else if (location.pathname === '/seleccionar-rol' || location.pathname === '/select-role') {
            const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
            console.log(`🛡️ ProtectedRoute: Profile complete, redirecting from role selection to ${dest}`);
            return <Navigate to={dest} replace />;
        }
    }

    // Rutas públicas para usuarios autenticados 
    if (!requireAuth && user && user.is_profile_complete) {
        // No permitir que los usuarios autenticados accedan a la página de inicio de sesión
        if (location.pathname === '/login') {
            const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
            console.log(`🛡️ ProtectedRoute: Authenticated user on /login, redirecting to ${dest}`);
            return <Navigate to={dest} replace />;
        }
    } else if (!requireAuth && user && !user.is_profile_complete && location.pathname === '/login') {
        console.log('🛡️ ProtectedRoute: Authenticated user (no profile) on /login, redirecting to /seleccionar-rol');
        return <Navigate to="/seleccionar-rol" replace />;
    }

    console.log('🛡️ ProtectedRoute: Access granted');
    return <>{children}</>;
}

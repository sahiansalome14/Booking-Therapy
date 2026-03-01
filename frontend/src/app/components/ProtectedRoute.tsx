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
        console.log('🛡️ ProtectedRoute: isInitializing=true, returning null');
        return null;
    }

    console.log('🛡️ ProtectedRoute Check:', {
        path: location.pathname,
        user: user ? { email: user.email, role: user.role } : 'null',
        requireAuth,
        requireRole
    });

    // 2. Unauthenticated state
    if (requireAuth && !user) {
        console.log('🛡️ ProtectedRoute: No user, redirecting to /');
        return <Navigate to="/" replace />;
    }

    // 3. Authenticated state but checking roles
    if (requireAuth && user) {
        // Si no tiene rol y requiere rol, ir a seleccionar rol
        if (requireRole && !user.role) {
            if (location.pathname !== '/select-role') {
                console.log('🛡️ ProtectedRoute: No role detected, redirecting to /select-role');
                return <Navigate to="/select-role" replace />;
            }
        }

        // Si YA tiene rol y está intentando acceder a /select-role, enviarlo a su dashboard
        if (user.role && location.pathname === '/select-role') {
            const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
            console.log(`🛡️ ProtectedRoute: User has role ${user.role}, redirecting from /select-role to ${dest}`);
            return <Navigate to={dest} replace />;
        }
    }

    // Public routes for authenticated users (like Login Page)
    if (!requireAuth && user && user.role) {
        // Don't let logged in users access login page
        if (location.pathname === '/login') {
            const dest = user.role === 'therapist' ? '/therapist/dashboard' : '/client/dashboard';
            console.log(`🛡️ ProtectedRoute: Authenticated user on /login, redirecting to ${dest}`);
            return <Navigate to={dest} replace />;
        }
    } else if (!requireAuth && user && !user.role && location.pathname === '/login') {
        console.log('🛡️ ProtectedRoute: Authenticated user (no role) on /login, redirecting to /select-role');
        return <Navigate to="/select-role" replace />;
    }

    console.log('🛡️ ProtectedRoute: Access granted');
    return <>{children}</>;
}

import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppRouter() {
  const { isInitializing } = useAuth();

  // If Supabase is still parsing the hash or checking local storage,
  // we do not render the RouterProvider. This prevents the router from clearing
  // the hash from the URL before Supabase can authenticate.
  if (isInitializing) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse space-y-4 flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          <p className="text-muted-foreground font-medium">Cargando sesión...</p>
        </div>
      </div>
    );
  }

  return <RouterProvider router={router} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}

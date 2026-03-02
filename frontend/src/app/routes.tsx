import { createBrowserRouter, Navigate } from "react-router-dom";
import { Layout } from "./Layout";
import Landing from "./pages/Landing";
import TherapistSearch from "./pages/TherapistSearch";
import TherapistProfile from "./pages/TherapistProfile";
import BookingFlow from "./pages/BookingFlow";
import ClientDashboard from "./pages/ClientDashboard";
import AuthPage from "./pages/AuthPage";
import OAuthCallback from "./pages/OAuthCallback";
import SelectRolePage from "./pages/SelectRolePage";
import TherapistDashboard from "./pages/TherapistDashboard";
import TherapistSchedule from "./pages/TherapistSchedule";
import TherapistSessions from "./pages/TherapistSessions";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Landing },
      //Permitir al público buscar y ver perfiles
      { path: "search", Component: TherapistSearch },
      { path: "therapist-profile/:id", Component: TherapistProfile },

      // rutas protegidas
      { path: "booking/:therapistId", element: <ProtectedRoute><BookingFlow /></ProtectedRoute> },
      { path: "client/dashboard", element: <ProtectedRoute><ClientDashboard /></ProtectedRoute> },
      { path: "therapist/dashboard", element: <ProtectedRoute><TherapistDashboard /></ProtectedRoute> },
      { path: "therapist/schedule", element: <ProtectedRoute><TherapistSchedule /></ProtectedRoute> },
      { path: "therapist/sessions", element: <ProtectedRoute><TherapistSessions /></ProtectedRoute> },
      { path: "select-role", element: <ProtectedRoute requireAuth={true} requireRole={false}><SelectRolePage /></ProtectedRoute> },
      { path: "seleccionar-rol", element: <ProtectedRoute requireAuth={true} requireRole={false}><SelectRolePage /></ProtectedRoute> },

      // callbacks
      { path: "oauth-callback", element: <ProtectedRoute requireAuth={false} requireRole={false}><OAuthCallback /></ProtectedRoute> },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "login",
    element: <ProtectedRoute requireAuth={false}><AuthPage /></ProtectedRoute>,
  },
  // Redirigir a los helpers para que los enlaces del encabezado sigan funcionando si incluyen el rol
  {
    path: "therapist/login",
    element: <Navigate to="/login?role=therapist" replace />,
  },
  {
    path: "client/login",
    element: <Navigate to="/login?role=client" replace />,
  }
]);

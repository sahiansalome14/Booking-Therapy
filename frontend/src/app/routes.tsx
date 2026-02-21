import { createBrowserRouter } from "react-router";
import { Layout } from "./Layout";
import Landing from "./pages/Landing";
import TherapistSearch from "./pages/TherapistSearch";
import TherapistProfile from "./pages/TherapistProfile";
import BookingFlow from "./pages/BookingFlow";
import ClientDashboard from "./pages/ClientDashboard";
import ClientLogin from "./pages/ClientLogin";
import TherapistLogin from "./pages/TherapistLogin";
import TherapistDashboard from "./pages/TherapistDashboard";
import TherapistSchedule from "./pages/TherapistSchedule";
import TherapistSessions from "./pages/TherapistSessions";
import NotFound from "./pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Landing },
      { path: "search", Component: TherapistSearch },
      { path: "therapist-profile/:id", Component: TherapistProfile },
      { path: "booking/:therapistId", Component: BookingFlow },
      { path: "client/dashboard", Component: ClientDashboard },
      { path: "therapist/dashboard", Component: TherapistDashboard },
      { path: "therapist/schedule", Component: TherapistSchedule },
      { path: "therapist/sessions", Component: TherapistSessions },
      { path: "*", Component: NotFound },
    ],
  },
  {
    path: "client/login",
    Component: ClientLogin,
  },
  {
    path: "therapist/login",
    Component: TherapistLogin,
  },
]);

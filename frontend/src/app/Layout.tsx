import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./components/Header";
import { ToastContainer } from "./components/Toast";

export function Layout() {
	const location = useLocation();
	const isHome = location.pathname === "/";

	return (
		<div className="min-h-screen bg-background">
			<Header />
			<main className={!isHome ? "pt-28 pb-12 px-4 md:px-8" : ""}>
				<Outlet />
			</main>
			<ToastContainer />
		</div>
	);
}


import axios from "axios";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../context/AuthContext";

export default function OAuthCallback() {
	const navigate = useNavigate();
	const [error, setError] = useState<string | null>(null);

	const { user, isInitializing } = useAuth();

	useEffect(() => {
		// Esperar a que AuthContext termine la verificación
		if (!isInitializing) {
			if (user) {
				if (!user.is_profile_complete) {
					console.log(
						"🚀 OAuthCallback: Perfil incompleto, dirigiéndose a /seleccionar-rol",
					);
					navigate("/seleccionar-rol?from=oauth", { replace: true });
				} else {
					const dest =
						user.role === "therapist"
							? "/therapist/dashboard"
							: "/client/dashboard";
					console.log(
						`🚀 OAuthCallback: Perfil completo, dirigiéndose a ${dest}`,
					);
					navigate(dest, { replace: true });
				}
			} else {
				console.log(
					"🚀 OAuthCallback: No user found after verification, going to /login",
				);
				navigate("/login", { replace: true });
			}
		}
	}, [user, isInitializing, navigate]);

	if (error) {
		return (
			<div className="flex items-center justify-center min-h-screen bg-background">
				<div className="p-8 text-center bg-card shadow-lg rounded-xl flex flex-col items-center">
					<div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="12" y1="8" x2="12" y2="12"></line>
							<line x1="12" y1="16" x2="12.01" y2="16"></line>
						</svg>
					</div>
					<h2 className="text-xl font-bold text-red-600 mb-2">
						Error de Autenticación
					</h2>
					<p className="text-muted-foreground">{error}</p>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen items-center justify-center bg-background">
			<div className="animate-pulse space-y-4 flex flex-col items-center">
				<div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
				<p className="text-muted-foreground font-medium">
					Verificando sesión...
				</p>
			</div>
		</div>
	);
}

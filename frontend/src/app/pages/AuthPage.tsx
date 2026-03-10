import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { HeartPulse, ShieldCheck, Sparkles } from "lucide-react";
import React from "react";
import { supabase } from "../../lib/supabase";
import { Card } from "../components/Card";

export default function AuthPage() {
	return (
		<div className="min-h-screen flex bg-background">
			<div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-primary/10">
				<div className="absolute inset-0 z-0">
					<img
						src="/login-bg.png"
						alt="Authentication Background"
						className="w-full h-full object-cover opacity-80"
					/>
					<div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-secondary/20 to-transparent backdrop-blur-[2px]"></div>
				</div>

				<div className="relative z-10 w-full flex flex-col justify-center px-20">
					<div className="mb-12">
						<h1 className="text-6xl font-black text-white mb-6 drop-shadow-2xl tracking-tighter">
							Bienvenido a <br />
							<span className="italic text-accent-vibrant">Vis Vitalis</span>
						</h1>
						<p className="text-xl text-white/90 font-medium max-w-md leading-relaxed">
							Tu puerta de entrada a una red de profesionales comprometidos con
							tu equilibrio y salud integral.
						</p>
					</div>

					<div className="space-y-8">
						{[
							{
								icon: ShieldCheck,
								text: "Privacidad absoluta en tus sesiones",
							},
							{ icon: HeartPulse, text: "Enfoque personalizado y humano" },
							{ icon: Sparkles, text: "Herramientas de gestión intuitivas" },
						].map((item, i) => (
							<div key={i} className="flex items-center gap-4 group">
								<div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 group-hover:scale-110 transition-transform">
									<item.icon className="w-6 h-6 text-white" />
								</div>
								<span className="text-white font-semibold text-lg">
									{item.text}
								</span>
							</div>
						))}
					</div>
				</div>

				<div className="absolute -bottom-20 -left-20 w-96 h-96 bg-accent-vibrant/20 rounded-full blur-3xl animate-pulse"></div>
			</div>

			<div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 relative overflow-hidden">
				<div className="lg:hidden absolute inset-0 -z-10 bg-gradient-to-tr from-accent/20 via-background to-muted/20"></div>

				<div className="max-w-md w-full animate-fade-in-up">
					<div className="text-center mb-10 lg:hidden">
						<h2 className="text-3xl font-black text-primary tracking-tighter">
							Vis Vitalis
						</h2>
					</div>

					<div className="mb-8">
						<h3 className="text-4xl font-extrabold tracking-tight mb-2">
							Comienza ahora
						</h3>
						<p className="text-muted-foreground font-medium">
							Inicia sesión o crea tu cuenta para continuar
						</p>
					</div>

					<Card className="p-8 shadow-2xl border-border/50 bg-card/50 backdrop-blur-sm rounded-3xl overflow-hidden relative group">
						<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary"></div>
						<Auth
							supabaseClient={supabase}
							appearance={{
								theme: ThemeSupa,
								variables: {
									default: {
										colors: {
											brand: "#2563EB",
											brandAccent: "#1d4ed8",
										},
										radii: {
											borderRadiusButton: "12px",
											inputBorderRadius: "12px",
										},
									},
								},
								className: {
									button:
										"hover:scale-[1.02] active:scale-[0.98] transition-all font-bold shadow-md",
									input:
										"bg-muted/50 border-none focus:ring-2 focus:ring-primary/20 transition-all",
								},
							}}
							providers={["google", "github"]}
							redirectTo={window.location.origin + "/oauth-callback"}
							theme="default"
							localization={{
								variables: {
									sign_in: {
										email_label: "Correo Electrónico",
										password_label: "Contraseña",
										button_label: "Iniciar Sesión",
									},
									sign_up: {
										email_label: "Correo Electrónico",
										password_label: "Contraseña",
										button_label: "Registrarse",
									},
								},
							}}
						/>
					</Card>

					<p className="mt-8 text-center text-sm text-muted-foreground font-medium">
						Al continuar, aceptas nuestros{" "}
						<a
							href="#"
							className="underline hover:text-primary transition-colors"
						>
							Términos de Servicio
						</a>{" "}
						y{" "}
						<a
							href="#"
							className="underline hover:text-primary transition-colors"
						>
							Política de Privacidad
						</a>
						.
					</p>
				</div>
			</div>

			<style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
      `}</style>
		</div>
	);
}

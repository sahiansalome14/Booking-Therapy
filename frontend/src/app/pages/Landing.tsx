import {
	Activity,
	ArrowRight,
	Calendar,
	Heart,
	MousePointer2,
	Shield,
	Sparkles,
	TrendingUp,
	Zap,
} from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/Button";

export default function Landing() {
	return (
		<div className="min-h-screen">
			{/* Main Section */}
			<section className="relative overflow-hidden">
				<div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-cyan-50 to-emerald-50">
					<div className="absolute inset-0 opacity-30">
						<div className="absolute top-20 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
						<div className="absolute top-40 right-20 w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
						<div className="absolute -bottom-20 left-1/2 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
					</div>
				</div>

				<div className="relative container mx-auto px-6 py-24">
					<div className="max-w-4xl mx-auto text-center">
						<div className="inline-flex items-center gap-2.5 bg-white/80 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8 border border-blue-200 shadow-lg hover:scale-105 transition-transform duration-300">
							<Zap className="w-4 h-4 text-blue-600 animate-pulse" />
							<span className="text-sm font-medium bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
								Energía vital a tu alcance
							</span>
						</div>

						<h1 className="text-6xl font-bold mb-6 leading-tight">
							<span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
								Conecta con terapeutas
							</span>
							<br />
							<span className="text-foreground">para tu bienestar</span>
						</h1>

						<p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
							Reserva sesiones de bienestar con los mejores terapeutas
							independientes.
							<span className="font-semibold text-blue-600">
								{" "}
								Agenda, paga y gestiona
							</span>{" "}
							todo en un solo lugar.
						</p>

						<div className="relative z-20 flex gap-4 justify-center flex-wrap">
							<Link to="/search" className="cursor-pointer">
								<Button
									variant="gradient"
									size="lg"
									className="px-10 shadow-2xl"
								>
									Reserva Sesión
								</Button>
							</Link>
							<Link to="/therapist/login" className="cursor-pointer">
								<Button variant="outline" size="lg" className="px-10">
									Soy Terapeuta
								</Button>
							</Link>
						</div>
					</div>
				</div>

				{/* Scroll Indicator */}
				<div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce opacity-50">
					<MousePointer2 className="w-6 h-6 text-primary" />
				</div>
			</section>

			{/* Stats Quickbar */}
			<section className="relative z-10 -mt-12 container mx-auto px-6">
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-card/80 backdrop-blur-xl border border-border shadow-2xl rounded-[2.5rem]">
					{[
						{ label: "Terapeutas", val: "500+" },
						{ label: "Sesiones", val: "10k+" },
						{ label: "Rating", val: "4.9/5" },
						{ label: "Punta de lanza", val: "Tech" },
					].map((stat, i) => (
						<div key={i} className="text-center group">
							<p className="text-3xl font-black text-primary group-hover:scale-110 transition-transform">
								{stat.val}
							</p>
							<p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
								{stat.label}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Features Section */}
			<section className="py-32 relative">
				<div className="container mx-auto px-6">
					<div className="text-center mb-24">
						<div className="inline-flex items-center gap-2 bg-primary/5 px-4 py-2 rounded-full mb-6 border border-primary/10">
							<Activity className="w-4 h-4 text-primary" />
							<span className="text-sm font-bold text-primary uppercase tracking-tighter">
								Ecosistema Profesional
							</span>
						</div>
						<h2 className="text-5xl font-black mb-6 tracking-tight">
							Diseñado para el{" "}
							<span className="text-primary italic">Máximo</span> Desempeño
						</h2>
						<p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
							Simplificamos la burocracia para que te enfoques en lo que
							importa: tu proceso de sanación o tu práctica clínica.
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{[
							{
								icon: Calendar,
								title: "Scheduling Inteligente",
								description:
									"Agenda automatizada con sincronización en tiempo real y recordatorios.",
								gradient: "from-blue-600 to-indigo-600",
							},
							{
								icon: Shield,
								title: "Seguridad de Grado Militar",
								description:
									"Tus datos clínicos y financieros protegidos bajo los estándares más altos.",
								gradient: "from-cyan-500 to-blue-500",
							},
							{
								icon: Heart,
								title: "Cuidado Humanizado",
								description:
									"Priorizamos la conexión humana en cada interacción digital.",
								gradient: "from-teal-500 to-emerald-500",
							},
							{
								icon: TrendingUp,
								title: "Analíticas de Progreso",
								description:
									"Visualiza tu evolución emocional y física de manera profesional.",
								gradient: "from-purple-600 to-pink-600",
							},
						].map((feature, index) => (
							<div
								key={index}
								className="group relative bg-white rounded-[2rem] p-10 shadow-sm border border-border hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-3"
							>
								<div
									className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-2xl flex items-center justify-center mb-10 group-hover:rotate-6 transition-all duration-500 shadow-xl shadow-primary/20`}
								>
									<feature.icon className="w-8 h-8 text-white" />
								</div>
								<h3 className="text-2xl font-bold mb-4 tracking-tight">
									{feature.title}
								</h3>
								<p className="text-muted-foreground leading-relaxed font-medium">
									{feature.description}
								</p>
								<div className="mt-8 flex items-center text-primary font-bold group-hover:gap-2 transition-all">
									Saber más{" "}
									<ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
								</div>
							</div>
						))}
					</div>
				</div>
			</section>

			{/* Timeline */}
			<section className="py-24 bg-muted/30 relative">
				<div className="container mx-auto px-6">
					<div className="text-center mb-24">
						<h2 className="text-5xl font-black mb-6 tracking-tight">
							Tres Pasos al Éxito
						</h2>
						<p className="text-muted-foreground text-xl">
							Tu transformación comienza hoy.
						</p>
					</div>

					<div className="max-w-6xl mx-auto">
						<div className="grid md:grid-cols-3 gap-16 relative">
							<div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10"></div>

							{[
								{
									number: "01",
									title: "Explora y Elige",
									description:
										"Encuentra el especialista que mejor se adapte a tu perfil energético.",
									color: "text-blue-600",
								},
								{
									number: "02",
									title: "Reserva Segura",
									description:
										"Confirma tu sesión con pasarelas de pago cifradas de extremo a extremo.",
									color: "text-cyan-600",
								},
								{
									number: "03",
									title: "Evoluciona",
									description:
										"Accede a tu sesión y gestiona tu historial clínico con un clic.",
									color: "text-teal-600",
								},
							].map((step, index) => (
								<div key={index} className="text-center group">
									<div
										className={`text-7xl font-black ${step.color} opacity-10 mb-[-40px] group-hover:opacity-20 transition-opacity`}
									>
										{step.number}
									</div>
									<div className="relative z-10 mb-8">
										<div className="w-12 h-12 bg-primary rounded-full mx-auto shadow-glow flex items-center justify-center text-white font-black group-hover:scale-125 transition-transform">
											{index + 1}
										</div>
									</div>
									<h3 className="text-2xl font-bold mb-4">{step.title}</h3>
									<p className="text-muted-foreground font-medium leading-relaxed">
										{step.description}
									</p>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* CTA Section */}
			<section className="py-24 container mx-auto px-6">
				<div className="relative rounded-[3rem] p-12 md:p-24 overflow-hidden shadow-glow">
					<div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-secondary animate-gradient-slow bg-[length:200%_200%]"></div>
					<div className="absolute inset-0 opacity-20">
						<div className="absolute top-0 right-0 w-96 h-96 bg-white blur-[100px] rounded-full"></div>
						<div className="absolute bottom-0 left-0 w-96 h-96 bg-accent blur-[100px] rounded-full"></div>
					</div>

					<div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto text-white">
						<h2 className="text-5xl md:text-6xl font-black mb-8 leading-tight">
							¿Listo para liberar tu Potencial Vital?
						</h2>
						<p className="text-xl md:text-2xl mb-12 text-blue-10 font-medium opacity-90 leading-relaxed">
							Únete a la mayor red de bienestar profesional y comienza a vivir
							con intención.
						</p>
						<Link to="/search">
							<Button
								size="lg"
								className="px-16 h-16 bg-white hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95 group"
							>
								<span className="text-primary text-xl font-black group-hover:mr-2 transition-all">
									Elegir Terapeuta
								</span>
								<Sparkles className="w-6 h-6 text-primary" />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			<style>{`
        @keyframes slow-zoom {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s infinite ease-in-out;
        }
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out forwards;
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.8s ease-out forwards;
        }
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
        @keyframes gradient-slow {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient-slow {
          animation: gradient-slow 8s infinite alternate;
        }
      `}</style>
		</div>
	);
}

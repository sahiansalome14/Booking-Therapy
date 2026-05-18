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
import { useLanguage } from "../context/LanguageContext";
import { Button } from "../components/Button";

export default function Landing() {
	const { t } = useLanguage();

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
								Vis Vitalis
							</span>
						</div>

						<h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
							<span className="bg-gradient-to-r from-blue-600 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
								{t("landing.title")}
							</span>
						</h1>

						<p className="text-xl text-muted-foreground mb-10 leading-relaxed max-w-2xl mx-auto">
							{t("landing.subtitle")}
						</p>

						<div className="relative z-20 flex gap-4 justify-center flex-wrap">
							<Link to="/search" className="cursor-pointer">
								<Button
									variant="gradient"
									size="lg"
									className="px-10 shadow-2xl"
								>
									{t("landing.searchBtn")}
								</Button>
							</Link>
							<Link to="/login?role=therapist" className="cursor-pointer">
								<Button variant="outline" size="lg" className="px-10">
									{t("nav.imTherapist")}
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
						{ label: t("landing.stats.therapists"), val: "500+" },
						{ label: t("landing.stats.sessions"), val: "10k+" },
						{ label: t("landing.stats.rating"), val: "4.9/5" },
						{ label: t("landing.stats.tech"), val: "Tech" },
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
								{t("landing.features.badge")}
							</span>
						</div>
						<h2 className="text-5xl font-black mb-6 tracking-tight">
							{t("landing.features.title")}{" "}
							<span className="text-primary italic">{t("landing.features.titleHighlight")}</span> {t("landing.features.titleEnd")}
						</h2>
						<p className="text-muted-foreground text-xl max-w-2xl mx-auto leading-relaxed font-medium">
							{t("landing.features.subtitle")}
						</p>
					</div>

					<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
						{[
							{
								icon: Calendar,
								title: t("landing.features.scheduling"),
								description: t("landing.features.schedulingDesc"),
								gradient: "from-blue-600 to-indigo-600",
							},
							{
								icon: Shield,
								title: t("landing.features.security"),
								description: t("landing.features.securityDesc"),
								gradient: "from-cyan-500 to-blue-500",
							},
							{
								icon: Heart,
								title: t("landing.features.care"),
								description: t("landing.features.careDesc"),
								gradient: "from-teal-500 to-emerald-500",
							},
							{
								icon: TrendingUp,
								title: t("landing.features.analytics"),
								description: t("landing.features.analyticsDesc"),
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
									{t("landing.features.learnMore")}{" "}
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
							{t("landing.steps.title")}
						</h2>
						<p className="text-muted-foreground text-xl">
							{t("landing.steps.subtitle")}
						</p>
					</div>

					<div className="max-w-6xl mx-auto">
						<div className="grid md:grid-cols-3 gap-16 relative">
							<div className="hidden md:block absolute top-[60px] left-[15%] right-[15%] h-0.5 bg-gradient-to-r from-primary/10 via-primary/50 to-primary/10"></div>

							{[
								{
									number: "01",
									title: t("landing.steps.step1Title"),
									description: t("landing.steps.step1Desc"),
									color: "text-blue-600",
								},
								{
									number: "02",
									title: t("landing.steps.step2Title"),
									description: t("landing.steps.step2Desc"),
									color: "text-cyan-600",
								},
								{
									number: "03",
									title: t("landing.steps.step3Title"),
									description: t("landing.steps.step3Desc"),
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
							{t("landing.cta.title")}
						</h2>
						<p className="text-xl md:text-2xl mb-12 text-blue-10 font-medium opacity-90 leading-relaxed">
							{t("landing.cta.subtitle")}
						</p>
						<Link to="/search">
							<Button
								size="lg"
								className="px-16 h-16 bg-white hover:bg-white/90 shadow-2xl transition-all hover:scale-105 active:scale-95 group"
							>
								<span className="text-primary text-xl font-black group-hover:mr-2 transition-all">
									{t("landing.cta.button")}
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

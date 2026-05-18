import { LogOut, Sparkles, User } from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import { Button } from "./Button";

export function Header() {
	const navigate = useNavigate();
	const { user, signout, isAuthenticated } = useAuth();
	const { t } = useTranslation();
	const { locale, setLocale } = useLanguage();

	const handleLogout = () => {
		signout();
		navigate("/login");
	};

	const toggleLanguage = () => {
		setLocale(locale === "es" ? "en" : "es");
	};

	return (
		<header className="fixed top-6 left-0 right-0 z-50 px-4 md:px-6 flex justify-center">
			<div className="w-full max-w-5xl">
				<div className="bg-white/90 backdrop-blur-md border border-white/40 shadow-xl rounded-full px-8 py-3 flex items-center justify-between">
					<Link
						to="/"
						className="flex items-center gap-2.5 hover:opacity-80 transition-all duration-300 group"
					>
						<div className="relative">
							<Sparkles className="w-7 h-7 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
							<div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
						</div>
						<span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
							Vis Vitalis
						</span>
					</Link>

					<nav className="flex items-center gap-8">
						{/* Selector de idioma */}
						<button
							onClick={toggleLanguage}
							className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-blue-200 bg-white hover:bg-blue-50 transition-all duration-200 text-sm font-medium"
							title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
						>
							<span className="text-base">{locale === "es" ? "🇪🇸" : "🇺🇸"}</span>
							<span className="text-xs font-bold text-blue-600 uppercase">{locale}</span>
						</button>

						{!isAuthenticated ? (
							<>
								<Link
									to="/search"
									className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
								>
									{t("nav.searchTherapists")}
									<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
								</Link>
								<Link
									to="/login?role=therapist"
									className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
								>
									{t("nav.imTherapist")}
									<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
								</Link>
								<Link to="/login?role=client">
									<Button variant="outline" size="sm">
										{t("nav.login")}
									</Button>
								</Link>
							</>
						) : (
							<>
								{user?.role === "client" && (
									<>
										<Link
											to="/search"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.searchTherapists")}
										</Link>
										<Link
											to="/client/dashboard"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.myDashboard")}
										</Link>
									</>
								)}

								{user?.role === "therapist" && (
									<>
										<Link
											to="/therapist/dashboard"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.dashboard")}
										</Link>
										<Link
											to="/therapist/schedule"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.schedule")}
										</Link>
										<Link
											to="/therapist/sessions"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.sessions")}
										</Link>
										<Link
											to="/therapist/profile"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											{t("nav.profile")}
										</Link>
									</>
								)}

								<div className="flex items-center gap-4 border-l border-border pl-4 ml-2">
									<span className="text-sm font-medium flex items-center">
										<User className="w-4 h-4 mr-2" />
										{user?.name || user?.email}
									</span>
									<Button
										variant="ghost"
										size="sm"
										onClick={handleLogout}
										className="text-red-500 hover:text-red-600 hover:bg-red-50"
									>
										<LogOut className="w-4 h-4 mr-2" />
										{t("nav.logout")}
									</Button>
								</div>
							</>
						)}
					</nav>
				</div>
			</div>
		</header>
	);
}

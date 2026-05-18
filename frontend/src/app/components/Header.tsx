import { LogOut, Sparkles, User, Menu, X } from "lucide-react";
import React, { useState } from "react";
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
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

	const handleLogout = () => {
		signout();
		setIsMobileMenuOpen(false);
		navigate("/login");
	};

	const toggleLanguage = () => {
		setLocale(locale === "es" ? "en" : "es");
	};

	return (
		<header className="fixed top-6 left-0 right-0 z-50 px-4 md:px-6 flex justify-center">
			<div className="w-full max-w-5xl">
				<div className="bg-white/90 backdrop-blur-md border border-white/40 shadow-xl rounded-full px-6 md:px-8 py-3 flex items-center justify-between relative">
					<Link
						to="/"
						onClick={() => setIsMobileMenuOpen(false)}
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

					{/* Botón de Menú Móvil */}
					<div className="flex items-center gap-3 md:hidden">
						{/* Selector de idioma en móvil */}
						<button
							onClick={toggleLanguage}
							className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-blue-200 bg-white text-xs font-medium"
							title={locale === "es" ? "Switch to English" : "Cambiar a Español"}
						>
							<span>{locale === "es" ? "🇪🇸" : "🇺🇸"}</span>
							<span className="font-bold text-blue-600 uppercase">{locale}</span>
						</button>

						<button
							onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
							className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
							aria-label="Menú principal"
						>
							{isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
						</button>
					</div>

					{/* Navegación de Escritorio */}
					<nav className="hidden md:flex items-center gap-8">
						{/* Selector de idioma en escritorio */}
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

					{/* Menú Desplegable Móvil */}
					{isMobileMenuOpen && (
						<div className="absolute top-full left-0 right-0 mt-3 p-6 bg-white/95 backdrop-blur-xl border border-blue-100 shadow-2xl rounded-3xl md:hidden flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-200 z-50">
							{!isAuthenticated ? (
								<>
									<Link
										to="/search"
										onClick={() => setIsMobileMenuOpen(false)}
										className="py-2 text-lg font-medium text-foreground hover:text-blue-600 transition-colors"
									>
										{t("nav.searchTherapists")}
									</Link>
									<Link
										to="/login?role=therapist"
										onClick={() => setIsMobileMenuOpen(false)}
										className="py-2 text-lg font-medium text-foreground hover:text-blue-600 transition-colors"
									>
										{t("nav.imTherapist")}
									</Link>
									<div className="pt-2 border-t border-blue-100 flex flex-col gap-2">
										<Link to="/login?role=client" onClick={() => setIsMobileMenuOpen(false)}>
											<Button className="w-full">{t("nav.login")}</Button>
										</Link>
									</div>
								</>
							) : (
								<>
									<div className="pb-3 border-b border-blue-100 flex items-center gap-3">
										<div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
											<User className="w-5 h-5" />
										</div>
										<div className="flex flex-col">
											<span className="font-bold text-foreground text-sm">
												{user?.name || "Usuario"}
											</span>
											<span className="text-xs text-muted-foreground">{user?.email}</span>
										</div>
									</div>

									{user?.role === "client" && (
										<>
											<Link
												to="/search"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.searchTherapists")}
											</Link>
											<Link
												to="/client/dashboard"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.myDashboard")}
											</Link>
										</>
									)}

									{user?.role === "therapist" && (
										<>
											<Link
												to="/therapist/dashboard"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.dashboard")}
											</Link>
											<Link
												to="/therapist/schedule"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.schedule")}
											</Link>
											<Link
												to="/therapist/sessions"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.sessions")}
											</Link>
											<Link
												to="/therapist/profile"
												onClick={() => setIsMobileMenuOpen(false)}
												className="py-2 text-base font-medium text-foreground hover:text-blue-600 transition-colors"
											>
												{t("nav.profile")}
											</Link>
										</>
									)}

									<div className="pt-2 border-t border-blue-100">
										<Button
											variant="ghost"
											onClick={handleLogout}
											className="w-full justify-center text-red-500 hover:text-red-600 hover:bg-red-50"
										>
											<LogOut className="w-5 h-5 mr-2" />
											{t("nav.logout")}
										</Button>
									</div>
								</>
							)}
						</div>
					)}
				</div>
			</div>
		</header>
	);
}

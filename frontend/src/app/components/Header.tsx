import { LogOut, Sparkles, User } from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "./Button";

export function Header() {
	const navigate = useNavigate();
	const { user, signout, isAuthenticated } = useAuth();

	const handleLogout = () => {
		signout();
		navigate("/login");
	};

	return (
		<header className="bg-white/80 backdrop-blur-lg border-b border-blue-100 sticky top-0 z-50 shadow-sm">
			<div className="container mx-auto px-6 py-4">
				<div className="flex items-center justify-between">
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
						{!isAuthenticated ? (
							<>
								<Link
									to="/search"
									className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
								>
									Buscar Terapeutas
									<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
								</Link>
								<Link
									to="/login?role=therapist"
									className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium relative group"
								>
									Soy Terapeuta
									<span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 group-hover:w-full transition-all duration-300"></span>
								</Link>
								<Link to="/login?role=client">
									<Button variant="outline" size="sm">
										Iniciar Sesión
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
											Buscar Terapeutas
										</Link>
										<Link
											to="/client/dashboard"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											Mi Dashboard
										</Link>
									</>
								)}

								{user?.role === "therapist" && (
									<>
										<Link
											to="/therapist/dashboard"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											Dashboard
										</Link>
										<Link
											to="/therapist/schedule"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											Agenda
										</Link>
										<Link
											to="/therapist/sessions"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											Sesiones
										</Link>
										<Link
											to="/therapist/profile"
											className="text-foreground hover:text-blue-600 transition-colors duration-200 font-medium"
										>
											Perfil
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
										Salir
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

import axios from "axios";
import React, {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { supabase } from "../../lib/supabase";
import * as authService from "../../services/auth";

export interface User {
	id: string; // Internal UUID
	external_auth_id?: string; // Provider ID
	email: string;
	name?: string;
	role?: "client" | "therapist" | null;
	is_profile_complete?: boolean;
}

export interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isInitializing: boolean;
	error: string | null;
	signin: (email: string, password: string) => Promise<void>;
	signup: (
		email: string,
		password: string,
		role: "client" | "therapist",
	) => Promise<void>;
	signout: () => void;
	refreshUser: () => Promise<void>;
	isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [isInitializing, setIsInitializing] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const isVerifying = React.useRef(false);
	const lastVerifiedSession = React.useRef<string | null>(null);

	const verifyUser = useCallback(async (session: any) => {
		if (!session) {
			setUser(null);
			setIsInitializing(false);
			lastVerifiedSession.current = null;
			return;
		}

		
		if (lastVerifiedSession.current === session.access_token) {
			console.log(" Session already verified, skipping");
			setIsInitializing(false);
			return;
		}

		if (isVerifying.current) {
			console.log(" Already verifying, waiting...");
			return;
		}

		isVerifying.current = true;

		try {
			console.log(" Verifying user with backend...");
			const backendUrl =
				import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
			const resp = await axios.get(`${backendUrl}/api/v1/auth/verify/`, {
				headers: { Authorization: `Bearer ${session.access_token}` },
			});

			const dbUser = resp.data;
			console.log(" Backend verification response:", dbUser);

			const metadataName =
				session.user?.user_metadata?.full_name ||
				session.user?.user_metadata?.name;

			const mergedUser: User = {
				id: dbUser.internal_id || session.user.id,
				external_auth_id: session.user.id,
				email: session.user.email,
				name: metadataName || dbUser.name || session.user.email,
				role: dbUser.role || null,
				is_profile_complete: dbUser.is_profile_complete ?? false,
			};

			console.log("Merged user state:", mergedUser);
			setUser(mergedUser);
			localStorage.setItem("user", JSON.stringify(mergedUser));
			lastVerifiedSession.current = session.access_token;

			if (mergedUser.role) {
				localStorage.setItem("role", mergedUser.role);
			} else {
				localStorage.removeItem("role");
			}
		} catch (err: unknown) {
			const status = axios.isAxiosError(err) ? err.response?.status : undefined;
			if (status === 502 || status === 503) {
				console.error(
					"Verify failed: el backend Django no está disponible (502/503). Revisa que el contenedor 'backend' esté corriendo en EC2.",
					err,
				);
			} else {
				console.error("Verify failed:", err);
			}
			setUser(null);
		} finally {
			isVerifying.current = false;
			setIsInitializing(false);
		}
	}, []);

	const refreshUser = async () => {
		console.log("refreshUser called");
		setIsLoading(true);
		try {
			console.log("Calling supabase.auth.refreshSession()...");
			const { data, error: refreshError } =
				await supabase.auth.refreshSession();

			if (refreshError) {
				console.error("Supabase refresh session error:", refreshError);
			}

			const session = data?.session;
			if (!session) {
				console.log("No session found after refresh");
				setUser(null);
				return;
			}

			console.log("Session refreshed successfully");
			localStorage.setItem("access_token", session.access_token);
			await verifyUser(session);
		} catch (err) {
			console.error("Failed to refresh user:", err);
		} finally {
			setIsLoading(false);
			console.log("refreshUser finished");
		}
	};

	useEffect(() => {
		const mounted = true;

		const runVerify = async (session: any) => {
			await verifyUser(session);
		};

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, session) => {
			console.log(" Supabase Auth Event:", event);

			if (session) {
				localStorage.setItem("access_token", session.access_token);
				if (
					event === "INITIAL_SESSION" ||
					event === "SIGNED_IN" ||
					event === "TOKEN_REFRESHED"
				) {
					runVerify(session);
				}
			} else {
				if (event === "SIGNED_OUT") {
					setUser(null);
					localStorage.removeItem("access_token");
					localStorage.removeItem("refresh_token");
					localStorage.removeItem("user");
					localStorage.removeItem("role");

					window.location.replace("/");
				} else if (event === "INITIAL_SESSION") {
					setIsInitializing(false);
				}
			}
		});

		return () => {
			subscription?.unsubscribe();
		};
	}, [verifyUser]);

	const signin = async (email: string, password: string) => {
		setIsLoading(true);
		setError(null);
		try {
			await authService.signin(email, password);
		} catch (err: any) {
			setError(err.message || "Error al iniciar sesión");
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const signup = async (
		email: string,
		password: string,
		role: "client" | "therapist",
	) => {
		setIsLoading(true);
		setError(null);
		try {
			await authService.signup(email, password, role);
		} catch (err: any) {
			setError(err.message || "Error al registrarse");
			throw err;
		} finally {
			setIsLoading(false);
		}
	};

	const signout = async () => {
		setUser(null);
		localStorage.removeItem("access_token");
		localStorage.removeItem("refresh_token");
		localStorage.removeItem("user");
		localStorage.removeItem("role");

		authService.signout();
		await supabase.auth.signOut();
	};

	const value: AuthContextType = {
		user,
		isLoading,
		isInitializing,
		error,
		signin,
		signup,
		signout,
		refreshUser,
		isAuthenticated: !!user,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within AuthProvider");
	}
	return context;
};

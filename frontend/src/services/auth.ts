import axios, { type AxiosInstance } from "axios";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

const apiClient: AxiosInstance = axios.create({
	baseURL: API_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para agregar el token en las requests autenticadas
apiClient.interceptors.request.use((config) => {
	const token = localStorage.getItem("access_token");
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
});

export interface AuthResponse {
	user: {
		id: string; // Internal UUID
		external_auth_id?: string; // Provider ID
		email: string;
		role?: "client" | "therapist";
	};
	session: {
		access_token: string;
		refresh_token?: string;
		expires_in?: number;
	};
}

export interface AuthError {
	message: string;
	error?: string;
}

/**
 * Sign up a new user via backend Supabase integration
 */
export async function signup(
	email: string,
	password: string,
	role: "client" | "therapist",
): Promise<AuthResponse> {
	try {
		const { data } = await apiClient.post("/api/v1/auth/signup/", {
			email,
			password,
			role,
		});

		// Guardar tokens localmente
		if (data.session?.access_token) {
			localStorage.setItem("access_token", data.session.access_token);
			if (data.session.refresh_token) {
				localStorage.setItem("refresh_token", data.session.refresh_token);
			}
		}

		return data;
	} catch (error: any) {
		throw {
			message:
				error.response?.data?.message || error.message || "Error en signup",
			error: error.response?.data?.error,
		} as AuthError;
	}
}

/**
 * Sign in an existing user via backend Supabase integration
 */
export async function signin(
	email: string,
	password: string,
): Promise<AuthResponse> {
	try {
		const { data } = await apiClient.post("/api/v1/auth/login/", {
			email,
			password,
		});

		// Guardar tokens localmente
		if (data.session?.access_token) {
			localStorage.setItem("access_token", data.session.access_token);
			if (data.session.refresh_token) {
				localStorage.setItem("refresh_token", data.session.refresh_token);
			}
		}

		return data;
	} catch (error: any) {
		throw {
			message:
				error.response?.data?.message || error.message || "Error en login",
			error: error.response?.data?.error,
		} as AuthError;
	}
}

/**
 * Sign out the current user
 */
export function signout(): void {
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
}

/**
 * Get the current access token
 */
export function getAccessToken(): string | null {
	return localStorage.getItem("access_token");
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
	return !!getAccessToken();
}

export default apiClient;

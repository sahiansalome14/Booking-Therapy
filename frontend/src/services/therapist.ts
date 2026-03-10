import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda`;

export interface Therapist {
	id: string;
	name: string;
	email: string;
	specialty: string;
	price: number;
	session_price?: number;
	image: string;
	avatar_url?: string;
	rating?: number;
	reviews?: number;
	bio?: string;
	experience?: string;
	experience_years?: number;
	location?: string;
	session_duration?: number;
	currency?: string;
}

const getHeaders = () => {
	const token = localStorage.getItem("access_token");
	return { Authorization: `Bearer ${token}` };
};

export const therapistService = {
	async getAll(): Promise<Therapist[]> {
		const response = await axios.get(`${API_URL}/therapists/`, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async getById(id: string): Promise<Therapist> {
		const response = await axios.get(`${API_URL}/therapists/${id}/`, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async getOwnProfile(): Promise<Therapist> {
		const response = await axios.get(`${API_URL}/therapists/profile/`, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async updateProfile(data: Partial<Therapist>): Promise<Therapist> {
		const response = await axios.put(`${API_URL}/therapists/profile/`, data, {
			headers: getHeaders(),
		});
		return response.data;
	},
};

import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v2/agenda`;

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

const normalizeTherapist = (t: any): Therapist => ({
	...t,
	price: t.price ?? t.session_price ?? 50000,
	image: t.image ?? t.avatar_url ?? "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=688",
	rating: t.rating ?? 4.9,
	reviews: t.reviews ?? 18,
	experience: t.experience ?? `${t.experience_years || 4} años de experiencia`,
});

export const therapistService = {
	async getAll(): Promise<Therapist[]> {
		const response = await axios.get(`${API_URL}/therapists/`, {
			headers: getHeaders(),
		});
		return response.data.map(normalizeTherapist);
	},

	async getById(id: string): Promise<Therapist> {
		const response = await axios.get(`${API_URL}/therapists/${id}/`, {
			headers: getHeaders(),
		});
		return normalizeTherapist(response.data);
	},

	async getOwnProfile(): Promise<Therapist> {
		const response = await axios.get(`${API_URL}/therapists/profile/`, {
			headers: getHeaders(),
		});
		return normalizeTherapist(response.data);
	},

	async updateProfile(data: Partial<Therapist>): Promise<Therapist> {
		const response = await axios.put(`${API_URL}/therapists/profile/`, data, {
			headers: getHeaders(),
		});
		return normalizeTherapist(response.data);
	},
};

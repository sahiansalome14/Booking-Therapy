import axios from "axios";

const API_URL = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda`;

export interface Slot {
	start: string;
	end: string;
	start_datetime: string;
	end_datetime: string;
	date: string;
}

export interface Availability {
	day: number;
	start: string;
	end: string;
}

export interface Block {
	internal_id?: string;
	start_datetime: string;
	end_datetime: string;
	reason?: string;
}

export interface Appointment {
	internal_id: string;
	start_datetime: string;
	end_datetime: string;
	price: number;
	status: string;
	modality: "VIRTUAL" | "PRESENCIAL";
	meeting_link?: string;
	therapist_location?: string;
	therapist_name: string;
	therapist_email: string;
	patient_name: string;
	patient_email: string;
}

const getHeaders = () => {
	const token = localStorage.getItem("access_token");
	return { Authorization: `Bearer ${token}` };
};

export const agendaService = {
	async getSlots(therapistId: string, fecha: string): Promise<Slot[]> {
		const response = await axios.get(`${API_URL}/slots/`, {
			params: { therapist_id: therapistId, fecha },
			headers: getHeaders(),
		});
		return response.data;
	},

	async getAvailability(therapistId?: string): Promise<Availability[]> {
		const response = await axios.get(`${API_URL}/availability/`, {
			params: { therapist_id: therapistId },
			headers: getHeaders(),
		});
		return response.data;
	},

	async setAvailability(availabilities: Availability[]): Promise<void> {
		await axios.post(
			`${API_URL}/availability/`,
			{ availabilities },
			{
				headers: getHeaders(),
			},
		);
	},

	async getBlocks(therapistId?: string): Promise<Block[]> {
		const response = await axios.get(`${API_URL}/blocks/`, {
			params: { therapist_id: therapistId },
			headers: getHeaders(),
		});
		return response.data;
	},

	async createBlock(data: Block): Promise<Block> {
		const response = await axios.post(`${API_URL}/blocks/`, data, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async getAppointments(
		role: "therapist" | "patient" = "patient",
	): Promise<Appointment[]> {
		const response = await axios.get(`${API_URL}/appointments/`, {
			params: { role },
			headers: getHeaders(),
		});
		return response.data;
	},

	async createAppointment(data: {
		therapist_id: string;
		target_date: string;
		start_time: string;
		modality?: string;
		patient_name?: string;
		patient_email?: string;
		patient_phone?: string;
		payment_info?: any;
	}): Promise<Appointment> {
		const response = await axios.post(`${API_URL}/appointments/`, data, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async deleteBlock(blockId: string): Promise<void> {
		await axios.delete(`${API_URL}/blocks/`, {
			params: { block_id: blockId },
			headers: getHeaders(),
		});
	},

	async getAppointmentById(appointmentId: string): Promise<Appointment> {
		const response = await axios.get(`${API_URL}/appointments/${appointmentId}/`, {
			headers: getHeaders(),
		});
		return response.data;
	},

	async cancelAppointment(appointmentId: string): Promise<Appointment> {
		const response = await axios.post(
			`${API_URL}/appointments/${appointmentId}/cancel/`,
			{},
			{
				headers: getHeaders(),
			},
		);
		return response.data;
	},
};

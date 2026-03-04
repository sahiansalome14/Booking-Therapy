import axios from 'axios';

const API_URL = 'http://localhost:8000/api/agenda';

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
    status: string;
    therapist_name: string;
    patient_name: string;
}

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return { Authorization: `Bearer ${token}` };
};

export const agendaService = {
    async getSlots(therapistId: string, fecha: string): Promise<Slot[]> {
        const response = await axios.get(`${API_URL}/slots/`, {
            params: { therapist_id: therapistId, fecha },
            headers: getHeaders()
        });
        return response.data;
    },

    async getAvailability(therapistId?: string): Promise<Availability[]> {
        const response = await axios.get(`${API_URL}/availability/`, {
            params: { therapist_id: therapistId },
            headers: getHeaders()
        });
        return response.data;
    },

    async setAvailability(availabilities: Availability[]): Promise<void> {
        await axios.post(`${API_URL}/availability/`, { availabilities }, {
            headers: getHeaders()
        });
    },

    async getBlocks(therapistId?: string): Promise<Block[]> {
        const response = await axios.get(`${API_URL}/blocks/`, {
            params: { therapist_id: therapistId },
            headers: getHeaders()
        });
        return response.data;
    },

    async createBlock(data: Block): Promise<Block> {
        const response = await axios.post(`${API_URL}/blocks/`, data, {
            headers: getHeaders()
        });
        return response.data;
    },

    async getAppointments(role: 'therapist' | 'patient' = 'patient'): Promise<Appointment[]> {
        const response = await axios.get(`${API_URL}/appointments/`, {
            params: { role },
            headers: getHeaders()
        });
        return response.data;
    },

    async createAppointment(data: { therapist_id: string; target_date: string; start_time: string }): Promise<Appointment> {
        const response = await axios.post(`${API_URL}/appointments/`, data, {
            headers: getHeaders()
        });
        return response.data;
    },

    async deleteBlock(blockId: string): Promise<void> {
        await axios.delete(`${API_URL}/blocks/`, {
            params: { block_id: blockId },
            headers: getHeaders()
        });
    }
};

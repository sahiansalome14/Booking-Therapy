import axios from "axios";

export interface OrderItem {
	type: "session" | "product" | "service";
	id: string;
	name: string;
	price: number;
	quantity: number;
	metadata?: any;
}

export interface Order {
	items: OrderItem[];
	customerInfo: {
		name: string;
		email: string;
		phone: string;
	};
	paymentMethod: string;
	total: number;
}

export const API_URL = `${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/payments`;

export const orderService = {
	calculateTotal(items: OrderItem[]): number {
		return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	},

	createOrderObject(
		items: OrderItem[],
		customerInfo: Order["customerInfo"],
		paymentMethod: string,
	): Order {
		return {
			items,
			customerInfo,
			paymentMethod,
			total: this.calculateTotal(items),
		};
	},
	// Future: integrated payment service calls here
};

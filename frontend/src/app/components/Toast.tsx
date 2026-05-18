import React, { useCallback, useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "info";

export interface ToastMessage {
	id: string;
	type: ToastType;
	message: string;
}

interface ToastProps {
	toast: ToastMessage;
	onClose: (id: string) => void;
}

const icons = {
	success: <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />,
	error: <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />,
	info: <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />,
};

const styles = {
	success: "bg-white border-l-4 border-emerald-500 shadow-xl shadow-emerald-500/10",
	error: "bg-white border-l-4 border-red-500 shadow-xl shadow-red-500/10",
	info: "bg-white border-l-4 border-blue-500 shadow-xl shadow-blue-500/10",
};

function ToastItem({ toast, onClose }: ToastProps) {
	useEffect(() => {
		const timer = setTimeout(() => onClose(toast.id), 4000);
		return () => clearTimeout(timer);
	}, [toast.id, onClose]);

	return (
		<div
			className={`flex items-center gap-3 px-4 py-3 rounded-2xl min-w-[280px] max-w-sm animate-fade-in-up ${styles[toast.type]}`}
		>
			{icons[toast.type]}
			<p className="text-sm font-medium text-gray-800 flex-1">{toast.message}</p>
			<button
				onClick={() => onClose(toast.id)}
				className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
			>
				<X className="w-4 h-4" />
			</button>
		</div>
	);
}

// ── Global singleton store ────────────────────────────────────────────────────
type Listener = (toasts: ToastMessage[]) => void;
let _toasts: ToastMessage[] = [];
const _listeners: Set<Listener> = new Set();

function notify(listeners: Set<Listener>, toasts: ToastMessage[]) {
	listeners.forEach((l) => l([...toasts]));
}

export const toast = {
	success: (message: string) => {
		const id = Math.random().toString(36).slice(2);
		_toasts = [..._toasts, { id, type: "success", message }];
		notify(_listeners, _toasts);
	},
	error: (message: string) => {
		const id = Math.random().toString(36).slice(2);
		_toasts = [..._toasts, { id, type: "error", message }];
		notify(_listeners, _toasts);
	},
	info: (message: string) => {
		const id = Math.random().toString(36).slice(2);
		_toasts = [..._toasts, { id, type: "info", message }];
		notify(_listeners, _toasts);
	},
};

// ── Container (rendered once in Layout) ──────────────────────────────────────
export function ToastContainer() {
	const [toasts, setToasts] = useState<ToastMessage[]>([]);

	useEffect(() => {
		const listener: Listener = (t) => setToasts(t);
		_listeners.add(listener);
		return () => { _listeners.delete(listener); };
	}, []);

	const handleClose = useCallback((id: string) => {
		_toasts = _toasts.filter((t) => t.id !== id);
		notify(_listeners, _toasts);
	}, []);

	if (toasts.length === 0) return null;

	return (
		<div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3">
			{toasts.map((t) => (
				<ToastItem key={t.id} toast={t} onClose={handleClose} />
			))}
		</div>
	);
}

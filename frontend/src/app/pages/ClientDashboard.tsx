import { Calendar, Clock, DollarSign, Loader2, Mail, User } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { type Appointment, agendaService } from "../../services/agenda";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function ClientDashboard() {
	const { user } = useAuth();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				const data = await agendaService.getAppointments("patient");
				setAppointments(data);
			} catch (error) {
				console.error("Error fetching client appointments:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAppointments();
	}, []);

	const upcomingSessions = appointments
		.filter(
			(s) =>
				(s.status === "RESERVADO" ||
					s.status === "confirmed" ||
					s.status === "PENDIENTE") &&
				new Date(s.start_datetime) >= new Date(),
		)
		.sort(
			(a, b) =>
				new Date(a.start_datetime).getTime() -
				new Date(b.start_datetime).getTime(),
		);

	const pastSessions = appointments
		.filter(
			(s) =>
				s.status === "COMPLETADO" ||
				s.status === "CANCELADO" ||
				s.status === "completed" ||
				s.status === "cancelled" ||
				new Date(s.start_datetime) < new Date(),
		)
		.sort(
			(a, b) =>
				new Date(b.start_datetime).getTime() -
				new Date(a.start_datetime).getTime(),
		);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-CO", {
			style: "currency",
			currency: "COP",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const now = new Date();
	const currentMonth = now.getMonth();
	const currentYear = now.getFullYear();

	const totalSpent = appointments
		.filter((s) => {
			const d = new Date(s.start_datetime);
			return (
				d.getMonth() === currentMonth &&
				d.getFullYear() === currentYear &&
				(s.status === "COMPLETADO" ||
					s.status === "RESERVADO" ||
					s.status === "PENDIENTE" ||
					s.status === "completed")
			);
		})
		.reduce((sum, s) => sum + Number(s.price || 0), 0);

	const getStatusBadge = (status: string) => {
		const s = status.toUpperCase();
		if (s === "RESERVADO" || s === "CONFIRMED")
			return { variant: "success" as const, label: "Confirmada" };
		if (s === "PENDIENTE")
			return { variant: "warning" as const, label: "Pendiente" };
		if (s === "COMPLETADO")
			return { variant: "info" as const, label: "Completada" };
		if (s === "CANCELADO")
			return { variant: "danger" as const, label: "Cancelada" };
		return { variant: "warning" as const, label: status };
	};

	const handleCancel = async (sessionId: string) => {
		if (confirm("¿Estás seguro de que deseas cancelar esta cita?")) {
			try {
				await agendaService.cancelAppointment(sessionId);
				setAppointments(
					appointments.map((s) =>
						s.internal_id === sessionId ? { ...s, status: "CANCELADO" } : s,
					),
				);
			} catch (error) {
				console.error("Error al cancelar sesión:", error);
				alert("No se pudo cancelar la sesión.");
			}
		}
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
			<div className="container mx-auto px-6">
				{/* Header */}
				<div className="mb-10">
					<h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
						Mi Dashboard
					</h1>
					<p className="text-muted-foreground text-lg">
						Bienvenida de vuelta, {user?.name || user?.email || "Cliente"}
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-4 gap-6 mb-10">
					<div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1 font-medium">
									Próximas Sesiones
								</p>
								<p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
									{upcomingSessions.length}
								</p>
							</div>
							<div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
								<Calendar className="w-7 h-7 text-white" />
							</div>
						</div>
					</div>

					<div className="bg-white border border-cyan-100 rounded-2xl p-6 shadow-lg shadow-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1 font-medium">
									Sesiones Totales
								</p>
								<p className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
									{appointments.length}
								</p>
							</div>
							<div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
								<Clock className="w-7 h-7 text-white" />
							</div>
						</div>
					</div>

					<div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1 font-medium">
									Total Invertido
								</p>
								<p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
									{formatCurrency(totalSpent)}
								</p>
							</div>
							<div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
								<DollarSign className="w-7 h-7 text-white" />
							</div>
						</div>
					</div>

					<div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all">
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1 font-medium">
									Terapeutas
								</p>
								<p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
									{new Set(appointments.map((s) => s.therapist_name)).size}
								</p>
							</div>
							<div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
								<User className="w-7 h-7 text-white" />
							</div>
						</div>
					</div>
				</div>

				<div className="grid lg:grid-cols-2 gap-6">
					{/* Upcoming Sessions */}
					<div>
						<div className="flex items-center justify-between mb-4">
							<h2 className="text-xl font-semibold">Próximas Sesiones</h2>
							<Link to="/search">
								<Button variant="outline" size="sm">
									Reservar Nueva
								</Button>
							</Link>
						</div>

						<div className="space-y-4">
							{upcomingSessions.length === 0 ? (
								<Card>
									<div className="text-center py-8">
										<Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
										<p className="text-muted-foreground mb-4">
											No tienes sesiones próximas
										</p>
										<Link to="/search">
											<Button size="sm">Buscar Terapeutas</Button>
										</Link>
									</div>
								</Card>
							) : (
								upcomingSessions.map((session) => (
									<Card
										key={session.internal_id}
										className="hover:border-primary transition-colors"
									>
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="font-semibold mb-1">
													{session.therapist_name}
												</h3>
												<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
													<Mail className="w-3.5 h-3.5" />
													<span>{session.therapist_email}</span>
												</div>
												<p className="text-sm text-primary">
													Sesión de Terapia
												</p>
											</div>
											<Badge variant={getStatusBadge(session.status).variant}>
												{getStatusBadge(session.status).label}
											</Badge>
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
											<div className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												<span>
													{new Date(session.start_datetime).toLocaleDateString(
														"es-ES",
														{
															month: "short",
															day: "numeric",
														},
													)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<Clock className="w-4 h-4" />
												<span>
													{new Date(session.start_datetime).toLocaleTimeString(
														[],
														{ hour: "2-digit", minute: "2-digit" },
													)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<DollarSign className="w-4 h-4" />
												<span>{formatCurrency(Number(session.price))}</span>
											</div>
										</div>

										<div className="flex gap-2 pt-3 border-t border-border">
											<Link
												to={`/session/${session.internal_id}`}
												className="flex-1"
											>
												<Button variant="outline" size="sm" className="w-full">
													Ver Detalles
												</Button>
											</Link>
											{(session.status.toUpperCase() === "PENDIENTE" ||
												session.status.toUpperCase() === "RESERVADO" ||
												session.status.toUpperCase() === "CONFIRMED") && (
												<Button
													variant="destructive"
													size="sm"
													className="flex-1"
													onClick={() => handleCancel(session.internal_id)}
												>
													Cancelar
												</Button>
											)}
										</div>
									</Card>
								))
							)}
						</div>
					</div>

					{/* History & Payments */}
					<div>
						<h2 className="text-xl font-semibold mb-4">
							Historial de Sesiones
						</h2>

						<div className="space-y-4">
							{pastSessions.length === 0 ? (
								<Card>
									<div className="text-center py-8">
										<Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
										<p className="text-muted-foreground">
											No tienes historial aún
										</p>
									</div>
								</Card>
							) : (
								pastSessions.map((session) => (
									<Card key={session.internal_id}>
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="font-semibold mb-1">
													{session.therapist_name}
												</h3>
												<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
													<Mail className="w-3.5 h-3.5" />
													<span>{session.therapist_email}</span>
												</div>
												<p className="text-sm text-primary">
													Sesión de Terapia
												</p>
											</div>
											<Badge variant={getStatusBadge(session.status).variant}>
												{getStatusBadge(session.status).label}
											</Badge>
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground">
											<div className="flex items-center gap-1">
												<Calendar className="w-4 h-4" />
												<span>
													{new Date(session.start_datetime).toLocaleDateString(
														"es-ES",
														{
															month: "short",
															day: "numeric",
															year: "numeric",
														},
													)}
												</span>
											</div>
											<div className="flex items-center gap-1">
												<DollarSign className="w-4 h-4" />
												<span>{formatCurrency(Number(session.price))}</span>
											</div>
											{session.modality === "PRESENCIAL" &&
												session.therapist_location && (
													<div className="flex items-center gap-1 text-xs text-muted-foreground mt-1 col-span-full">
														<span className="font-medium text-primary">
															Ubicación:
														</span>
														<span>{session.therapist_location}</span>
													</div>
												)}
										</div>

										<div className="flex gap-2 mt-3 pt-3 border-t border-border">
											<Link
												to={`/session/${session.internal_id}`}
												className="flex-1"
											>
												<Button variant="outline" size="sm" className="w-full">
													Ver Detalles
												</Button>
											</Link>
											{(session.status === "COMPLETADO" ||
												session.status === "completed") && (
												<Button variant="outline" size="sm" className="flex-1">
													Dejar Reseña
												</Button>
											)}
										</div>
									</Card>
								))
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

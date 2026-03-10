import axios from "axios";
import {
	ArrowLeft,
	BadgeCheck,
	Calendar,
	Clock,
	DollarSign,
	Loader2,
	Mail,
	MapPin,
	User,
	Video,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { type Appointment, agendaService } from "../../services/agenda";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function SessionDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const [appointment, setAppointment] = useState<Appointment | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchSession = async () => {
			if (!id) return;
			try {
				const session = await agendaService.getAppointmentById(id);
				setAppointment(session);
			} catch (error) {
				console.error("Error fetching session details:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSession();
	}, [id]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-CO", {
			style: "currency",
			currency: "COP",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const getStatusBadge = (status: string) => {
		const s = status ? status.toLowerCase() : "";
		if (s === "confirmed")
			return { variant: "success" as const, label: "Confirmada" };
		if (s === "scheduled")
			return { variant: "warning" as const, label: "Pendiente" };
		if (s === "completed")
			return { variant: "info" as const, label: "Completada" };
		if (s === "cancelled")
			return { variant: "danger" as const, label: "Cancelada" };
		return { variant: "warning" as const, label: status };
	};

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!appointment) {
		return (
			<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
				<h1 className="text-2xl font-bold mb-4">Sesión no encontrada</h1>
				<Button onClick={() => navigate(-1)}>Volver</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-12">
			<div className="container mx-auto px-6 max-w-3xl">
				<button
					onClick={() => navigate(-1)}
					className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
				>
					<ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
					<span>Volver al Dashboard</span>
				</button>

				<Card className="p-8 shadow-xl border-blue-100 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10" />

					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
						<div>
							<div className="flex items-center gap-3 mb-2">
								<h1 className="text-3xl font-bold text-foreground">
									Detalles de la Sesión
								</h1>
								<Badge
									variant={getStatusBadge(appointment.status).variant}
									className="text-sm px-3 py-1"
								>
									{getStatusBadge(appointment.status).label}
								</Badge>
							</div>
							<p className="text-muted-foreground">
								ID de Referencia: {appointment.internal_id.split("-")[0]}
							</p>
						</div>
						<div className="text-right">
							<p className="text-sm text-muted-foreground mb-1">
								Costo de Sesión
							</p>
							<p className="text-3xl font-bold text-primary">
								{formatCurrency(Number(appointment.price))}
							</p>
						</div>
					</div>

					<div className="grid md:grid-cols-2 gap-10">
						<div className="space-y-8">
							<section>
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
									Información de la Cita
								</h2>
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
											<Calendar className="w-5 h-5" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Fecha</p>
											<p className="font-medium">
												{new Date(
													appointment.start_datetime,
												).toLocaleDateString("es-ES", {
													weekday: "long",
													year: "numeric",
													month: "long",
													day: "numeric",
												})}
											</p>
										</div>
									</div>
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
											<Clock className="w-5 h-5" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Hora</p>
											<p className="font-medium">
												{new Date(
													appointment.start_datetime,
												).toLocaleTimeString([], {
													hour: "2-digit",
													minute: "2-digit",
												})}{" "}
												-{" "}
												{new Date(appointment.end_datetime).toLocaleTimeString(
													[],
													{ hour: "2-digit", minute: "2-digit" },
												)}
											</p>
										</div>
									</div>
								</div>
							</section>

							<section>
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
									Modalidad
								</h2>
								<div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
									{appointment.modality === "VIRTUAL" ||
									!appointment.modality ? (
										<div className="space-y-4">
											<div className="flex items-center gap-3 text-primary">
												<Video className="w-6 h-6" />
												<span className="font-bold text-lg">
													Sesión Virtual (Jitsi)
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												La sesión se llevará a cabo mediante un enlace seguro.
												Por favor, asegúrate de tener buena conexión.
											</p>
											{appointment.meeting_link ? (
												<a
													href={appointment.meeting_link}
													target="_blank"
													rel="noopener noreferrer"
													className="block"
												>
													<Button className="w-full gap-2 shadow-lg shadow-primary/20">
														<Video className="w-4 h-4" />
														Unirse a la Reunión
													</Button>
												</a>
											) : (
												<div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
													El enlace de la reunión estará disponible pronto.
												</div>
											)}
										</div>
									) : (
										<div className="space-y-4">
											<div className="flex items-center gap-3 text-emerald-600">
												<MapPin className="w-6 h-6" />
												<span className="font-bold text-lg">
													Sesión Presencial
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												La sesión será en el consultorio del terapeuta.
											</p>
											<div className="p-4 bg-white rounded-xl border border-emerald-100">
												<p className="text-sm font-medium mb-1">Dirección:</p>
												<p className="text-foreground">
													{appointment.therapist_location ||
														"Dirección no especificada"}
												</p>
											</div>
										</div>
									)}
								</div>
							</section>
						</div>

						<div className="space-y-8">
							<section>
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
									Participantes
								</h2>
								<Card className="bg-muted/20 border-border/50 p-5 space-y-6">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
												Terapeuta
											</p>
											<p className="font-bold">{appointment.therapist_name}</p>
											<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
												<Mail className="w-3 h-3" />
												<span>{appointment.therapist_email}</span>
											</div>
										</div>
									</div>

									<div className="h-px bg-border/50" />

									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center text-white shadow-md">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
												Paciente
											</p>
											<p className="font-bold">{appointment.patient_name}</p>
											<div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
												<Mail className="w-3 h-3" />
												<span>{appointment.patient_email}</span>
											</div>
										</div>
									</div>
								</Card>
							</section>

							<section>
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
									Recordatorio
								</h2>
								<div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
									<div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
										<BadgeCheck className="w-4 h-4" />
										Recomendaciones
									</div>
									<ul className="text-xs text-blue-700/80 space-y-2 list-disc list-inside">
										{appointment.modality === "VIRTUAL" ||
										!appointment.modality ? (
											<>
												<li>
													Asegúrate de tener una conexión estable a internet.
												</li>
												<li>Usa audífonos para mejor privacidad y audio.</li>
												<li>
													Conéctate 5 minutos antes desde un lugar tranquilo.
												</li>
											</>
										) : (
											<>
												<li>Llega 10 minutos antes de tu cita pactada.</li>
												<li>
													Recuerda traer tu documento de identidad si es
													necesario.
												</li>
												<li>
													Calcula tu tiempo de desplazamiento al consultorio.
												</li>
											</>
										)}
										<li>
											Si no puedes asistir, cancela con 24h de antelación.
										</li>
									</ul>
								</div>
							</section>
						</div>
					</div>
					<div className="mt-8 pt-8 border-t border-border flex flex-wrap gap-4">
						{(() => {
							const s = appointment.status.toLowerCase();
							const isPast = new Date(appointment.start_datetime) < new Date();
							const canCancel =
								(s === "scheduled" || s === "confirmed") && !isPast;

							return (
								<>
									{s === "scheduled" && user?.role === "therapist" && (
										<Button
											variant="primary"
											onClick={async () => {
												try {
													await axios.post(
														`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${appointment.internal_id}/confirm/`,
														{},
														{
															headers: {
																Authorization: `Bearer ${localStorage.getItem("access_token")}`,
															},
														},
													);
													setAppointment({
														...appointment,
														status: "confirmed",
													});
												} catch (error) {
													alert("No se pudo confirmar la sesión.");
												}
											}}
										>
											Aceptar Cita
										</Button>
									)}
									{canCancel && (
										<Button
											variant="destructive"
											onClick={async () => {
												if (
													confirm("¿Estás seguro de que deseas cancelar esta cita?")
												) {
													try {
														await agendaService.cancelAppointment(
															appointment.internal_id,
														);
														setAppointment({
															...appointment,
															status: "cancelled",
														});
													} catch (error) {
														alert("No se pudo cancelar la sesión.");
													}
												}
											}}
										>
											Cancelar Cita
										</Button>
									)}
									{s === "confirmed" && isPast && user?.role === "therapist" && (
										<Button
											variant="primary"
											className="bg-emerald-600 hover:bg-emerald-700 text-white"
											onClick={async () => {
												try {
													await axios.post(
														`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${appointment.internal_id}/complete/`,
														{},
														{
															headers: {
																Authorization: `Bearer ${localStorage.getItem("access_token")}`,
															},
														},
													);
													setAppointment({
														...appointment,
														status: "completed",
													});
												} catch (error) {
													alert("No se pudo completar la sesión.");
												}
											}}
										>
											Marcar como Completada
										</Button>
									)}
								</>
							);
						})()}
					</div>
				</Card>
			</div>
		</div>
	);
}

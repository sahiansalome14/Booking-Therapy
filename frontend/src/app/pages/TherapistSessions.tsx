import axios from "axios";
import {
	Calendar,
	CheckCircle2,
	Clock,
	DollarSign,
	Filter,
	Loader2,
	Mail,
	RotateCcw,
	Search,
	User,
	X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Appointment, agendaService } from "../../services/agenda";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export default function TherapistSessions() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [statusFilter, setStatusFilter] = useState("all");
	const [searchQuery, setSearchQuery] = useState("");
	const { t, i18n } = useTranslation();

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				const data = await agendaService.getAppointments("therapist");
				setAppointments(data);
			} catch (error) {
				console.error("Error fetching appointments:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAppointments();
	}, []);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat(i18n.language === "es" ? "es-CO" : "en-US", {
			style: "currency",
			currency: i18n.language === "es" ? "COP" : "USD",
			minimumFractionDigits: 0,
		}).format(amount);
	};

	const filteredSessions = appointments.filter((session) => {
		const s = session.status.toUpperCase();
		const filter = statusFilter.toUpperCase();
		const matchesStatus =
			statusFilter === "all" ||
			(filter === "PENDING" && s === "SCHEDULED") ||
			(filter === "CONFIRMED" && s === "CONFIRMED") ||
			(filter === "COMPLETED" && s === "COMPLETED") ||
			(filter === "CANCELLED" && s === "CANCELLED");

		const matchesSearch =
			session.patient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			session.patient_email?.toLowerCase().includes(searchQuery.toLowerCase());
		return matchesStatus && matchesSearch;
	});

	const getStatusBadge = (status: string) => {
		const s = status ? status.toLowerCase() : "";
		if (s === "confirmed")
			return {
				variant: "success" as const,
				label: t("status.confirmed"),
				count: appointments.filter((a) => a.status.toLowerCase() === "confirmed")
					.length,
			};
		if (s === "scheduled")
			return {
				variant: "warning" as const,
				label: t("status.scheduled"),
				count: appointments.filter((a) => a.status.toLowerCase() === "scheduled")
					.length,
			};
		if (s === "completed")
			return {
				variant: "info" as const,
				label: t("status.completed"),
				count: appointments.filter((a) => a.status.toLowerCase() === "completed")
					.length,
			};
		if (s === "cancelled")
			return {
				variant: "danger" as const,
				label: t("status.cancelled"),
				count: appointments.filter((a) => a.status.toLowerCase() === "cancelled")
					.length,
			};
		return { variant: "warning" as const, label: status, count: 0 };
	};

	const handleConfirm = async (sessionId: string) => {
		if (confirm(t("sessions.confirmAccept"))) {
			try {
				await axios.post(
					`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${sessionId}/confirm/`,
					{},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("access_token")}`,
						},
					},
				);
				setAppointments(
					appointments.map((s) =>
						s.internal_id === sessionId ? { ...s, status: "confirmed" } : s,
					),
				);
			} catch (error) {
				console.error("Error confirming session:", error);
				alert(t("sessions.confirmError"));
			}
		}
	};

	const handleCancel = async (sessionId: string) => {
		if (confirm(t("sessions.confirmCancel"))) {
			try {
				await agendaService.cancelAppointment(sessionId);
				setAppointments(
					appointments.map((s) =>
						s.internal_id === sessionId ? { ...s, status: "cancelled" } : s,
					),
				);
			} catch (error) {
				console.error("Error cancelling session:", error);
				alert(t("sessions.cancelError"));
			}
		}
	};

	const handleComplete = async (sessionId: string) => {
		if (
			confirm(t("sessions.confirmComplete"))
		) {
			try {
				await axios.post(
					`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${sessionId}/complete/`,
					{},
					{
						headers: {
							Authorization: `Bearer ${localStorage.getItem("access_token")}`,
						},
					},
				);
				setAppointments(
					appointments.map((s) =>
						s.internal_id === sessionId ? { ...s, status: "completed" } : s,
					),
				);
			} catch (error) {
				console.error("Error completing session:", error);
				alert(t("sessions.completeError"));
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
		<div className="min-h-screen bg-background py-8">
			<div className="container mx-auto px-6">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">{t("sessions.title")}</h1>
					<p className="text-muted-foreground">
						{t("sessions.subtitle")}
					</p>
				</div>

				{/* Stats */}
				<div className="grid md:grid-cols-4 gap-6 mb-8">
					<Card
						className="cursor-pointer hover:border-yellow-400 transition-colors"
						onClick={() => setStatusFilter("pending")}
					>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">{t("sessions.pending")}</p>
								<p className="text-3xl font-bold text-yellow-600">
									{getStatusBadge("scheduled").count}
								</p>
							</div>
							<Badge variant="warning">{t("sessions.requiresAction")}</Badge>
						</div>
					</Card>

					<Card
						className="cursor-pointer hover:border-green-400 transition-colors"
						onClick={() => setStatusFilter("confirmed")}
					>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									{t("sessions.confirmed")}
								</p>
								<p className="text-3xl font-bold text-green-600">
									{getStatusBadge("confirmed").count}
								</p>
							</div>
							<Badge variant="success">{t("sessions.active")}</Badge>
						</div>
					</Card>

					<Card
						className="cursor-pointer hover:border-blue-400 transition-colors"
						onClick={() => setStatusFilter("completed")}
					>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									{t("sessions.completed")}
								</p>
								<p className="text-3xl font-bold text-blue-600">
									{getStatusBadge("completed").count}
								</p>
							</div>
							<Badge variant="info">{t("sessions.history")}</Badge>
						</div>
					</Card>

					<Card
						className="cursor-pointer hover:border-red-400 transition-colors"
						onClick={() => setStatusFilter("cancelled")}
					>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">{t("sessions.cancelled")}</p>
								<p className="text-3xl font-bold text-red-600">
									{getStatusBadge("cancelled").count}
								</p>
							</div>
							<Badge variant="danger">{t("sessions.archived")}</Badge>
						</div>
					</Card>
				</div>

				{/* Filters */}
				<Card className="mb-6">
					<div className="flex flex-col lg:flex-row gap-4">
						{/* Search */}
						<div className="flex-1">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
								<input
									type="text"
									placeholder={t("sessions.searchPlaceholder")}
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
								/>
							</div>
						</div>

						{/* Status Filter */}
						<div className="lg:w-64">
							<select
								value={statusFilter}
								onChange={(e) => setStatusFilter(e.target.value)}
								className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
							>
								<option value="all">{t("sessions.allStatuses")}</option>
								<option value="pending">{t("sessions.pending")}</option>
								<option value="confirmed">{t("sessions.confirmed")}</option>
								<option value="completed">{t("sessions.completed")}</option>
								<option value="cancelled">{t("sessions.cancelled")}</option>
							</select>
						</div>
					</div>
				</Card>

				{/* Results Count */}
				<div className="mb-4">
					<p className="text-muted-foreground">
						{filteredSessions.length === 1
							? t("sessions.sessionsFound_one", { count: filteredSessions.length })
							: t("sessions.sessionsFound_other", { count: filteredSessions.length })}
					</p>
				</div>

				{/* Sessions List */}
				<div className="space-y-4">
					{filteredSessions.length === 0 ? (
						<Card>
							<div className="text-center py-12">
								<Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
								<p className="text-lg text-muted-foreground mb-2">
									{t("sessions.noSessions")}
								</p>
								<p className="text-sm text-muted-foreground">
									{t("sessions.tryFilters")}
								</p>
							</div>
						</Card>
					) : (
						filteredSessions.map((session) => {
							const isPast = new Date(session.start_datetime) < new Date();
							return (
								<Card
									key={session.internal_id}
									className="hover:border-primary transition-colors"
								>
									<div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
										{/* Session Info */}
										<div className="flex-1">
											<div className="flex items-start justify-between mb-3">
												<div>
													<div className="flex items-center gap-3 mb-1">
														<h3 className="font-semibold text-lg">
															{session.patient_name}
														</h3>
														<Badge
															variant={getStatusBadge(session.status).variant}
														>
															{getStatusBadge(session.status).label}
														</Badge>
													</div>
													<div className="flex items-center gap-2 text-sm text-muted-foreground">
														<Mail className="w-4 h-4" />
														<span>{session.patient_email}</span>
													</div>
													<p className="text-primary mt-1 text-sm">
														{t("sessions.therapySession")}
													</p>
												</div>
											</div>

											<div className="grid md:grid-cols-3 gap-4 text-sm mt-3">
												<div className="flex items-center gap-2 text-muted-foreground">
													<Calendar className="w-4 h-4" />
													<span>
														{new Date(
															session.start_datetime,
														).toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", {
															weekday: "long",
															year: "numeric",
															month: "long",
															day: "numeric",
														})}
													</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<Clock className="w-4 h-4" />
													<span>
														{new Date(
															session.start_datetime,
														).toLocaleTimeString([], {
															hour: "2-digit",
															minute: "2-digit",
														})}
													</span>
												</div>
												<div className="flex items-center gap-2 text-muted-foreground">
													<DollarSign className="w-4 h-4" />
													<span>{formatCurrency(Number(session.price))}</span>
												</div>
												{session.modality === "PRESENCIAL" &&
													session.therapist_location && (
														<div className="flex items-center gap-2 text-sm text-primary mt-1 col-span-full">
															<span className="font-medium">{t("sessions.location")}:</span>
															<span>{session.therapist_location}</span>
														</div>
													)}
											</div>
										</div>

										{/* Actions */}
										<div className="flex flex-wrap gap-2 lg:flex-col lg:w-48">
											{session.status.toLowerCase() === "scheduled" && (
												<>
													<Button
														size="sm"
														className="flex-1 lg:w-full"
														onClick={() => handleConfirm(session.internal_id)}
													>
														<CheckCircle2 className="w-4 h-4 mr-1" />
														{t("sessions.acceptAppointment")}
													</Button>
													<Link
														to={`/session/${session.internal_id}`}
														className="flex-1 lg:w-full"
													>
														<Button
															variant="outline"
															size="sm"
															className="w-full"
														>
															{t("sessions.viewDetails")}
														</Button>
													</Link>
													<Button
														variant="destructive"
														size="sm"
														className="flex-1 lg:w-full"
														onClick={() => handleCancel(session.internal_id)}
														disabled={isPast}
													>
														<X className="w-4 h-4 mr-1" />
														{t("sessions.cancel")}
													</Button>
												</>
											)}

											{session.status.toLowerCase() === "confirmed" && (
												<>
													<Link
														to={`/session/${session.internal_id}`}
														className="flex-1 lg:w-full"
													>
														<Button
															variant="outline"
															size="sm"
															className="w-full"
														>
															{t("sessions.viewDetails")}
														</Button>
													</Link>
													{isPast && (
														<Button
															variant="primary"
															size="sm"
															className="flex-1 lg:w-full bg-emerald-600 hover:bg-emerald-700 text-white border-none"
															onClick={() =>
																handleComplete(session.internal_id)
															}
														>
															<CheckCircle2 className="w-4 h-4 mr-1" />
															{t("sessions.markCompleted")}
														</Button>
													)}
													<Button
														variant="destructive"
														size="sm"
														className="flex-1 lg:w-full"
														onClick={() => handleCancel(session.internal_id)}
														disabled={isPast}
													>
														<X className="w-4 h-4 mr-1" />
														{t("sessions.cancel")}
													</Button>
												</>
											)}

											{session.status.toLowerCase() === "completed" && (
												<>
													<Link
														to={`/session/${session.internal_id}`}
														className="flex-1 lg:w-full"
													>
														<Button
															variant="outline"
															size="sm"
															className="w-full"
														>
															{t("sessions.viewDetails")}
														</Button>
													</Link>
												</>
											)}

											{session.status.toLowerCase() === "cancelled" && (
												<Link
													to={`/session/${session.internal_id}`}
													className="w-full"
												>
													<Button
														variant="outline"
														size="sm"
														className="w-full"
													>
														{t("sessions.viewDetails")}
													</Button>
												</Link>
											)}
										</div>
									</div>
								</Card>
							);
						})
					)}
				</div>
			</div>
		</div>
	);
}

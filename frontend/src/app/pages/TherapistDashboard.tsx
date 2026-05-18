import axios from "axios";
import {
	Calendar,
	Clock,
	DollarSign,
	Loader2,
	Mail,
	TrendingUp,
	User,
	Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Appointment, agendaService } from "../../services/agenda";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function TherapistDashboard() {
	const { user } = useAuth();
	const { t } = useTranslation();
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const fetchAppointments = async () => {
			try {
				const data = await agendaService.getAppointments("therapist");
				setAppointments(data);
			} catch (error) {
				console.error("Error fetching therapist appointments:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchAppointments();
	}, []);

	const todayStr = new Date().toISOString().split("T")[0];

	const todaySessions = appointments.filter((s) => {
		const status = s.status ? s.status.toLowerCase() : "";
		return (
			s.start_datetime.startsWith(todayStr) &&
			(status === "confirmed" || status === "scheduled")
		);
	});

	const upcomingSessions = appointments
		.filter((s) => {
			const status = s.status ? s.status.toLowerCase() : "";
			return (
				new Date(s.start_datetime) >= new Date() &&
				(status === "confirmed" || status === "scheduled")
			);
		})
		.sort(
			(a, b) =>
				new Date(a.start_datetime).getTime() -
				new Date(b.start_datetime).getTime(),
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

	const monthlyRevenue = appointments
		.filter((s) => {
			const d = new Date(s.start_datetime);
			const status = s.status ? s.status.toLowerCase() : "";
			return (
				d.getMonth() === currentMonth &&
				d.getFullYear() === currentYear &&
				(status === "completed" ||
					status === "confirmed" ||
					status === "scheduled")
			);
		})
		.reduce((sum, s) => sum + Number(s.price || 0), 0);

	const monthlySessionsCount = appointments.filter((s) => {
		const d = new Date(s.start_datetime);
		const status = s.status ? s.status.toLowerCase() : "";
		return (
			d.getMonth() === currentMonth &&
			d.getFullYear() === currentYear &&
			status !== "cancelled"
		);
	}).length;

	const totalClients = new Set(appointments.map((s) => s.patient_name)).size;

	const getStatusBadge = (status: string) => {
		const s = status ? status.toLowerCase() : "";
		if (s === "confirmed")
			return { variant: "success" as const, label: t("status.confirmed") };
		if (s === "scheduled")
			return { variant: "warning" as const, label: t("status.scheduled") };
		if (s === "completed")
			return { variant: "info" as const, label: t("status.completed") };
		if (s === "cancelled")
			return { variant: "danger" as const, label: t("status.cancelled") };
		return { variant: "warning" as const, label: status };
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
				<div className="mb-8">
					<h1 className="text-3xl font-bold mb-2">🧑‍⚕️ {t("therapistDashboard.title")}</h1>
					<p className="text-muted-foreground">
						👋 {t("therapistDashboard.welcomeBack", { name: user?.name || user?.email || "Terapeuta" })}
					</p>
				</div>

				{/* Stats Cards */}
				<div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
					<Card>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									☀️ {t("therapistDashboard.todaySessions")}
								</p>
								<p className="text-3xl font-bold">{todaySessions.length}</p>
								<p className="text-sm text-green-600 mt-1">{t("therapistDashboard.vsYesterday")}</p>
							</div>
							<div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
								<Calendar className="w-6 h-6 text-primary" />
							</div>
						</div>
					</Card>

					<Card>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									📅 {t("therapistDashboard.upcomingSessions")}
								</p>
								<p className="text-3xl font-bold">{upcomingSessions.length}</p>
								<p className="text-sm text-muted-foreground mt-1">
									{t("therapistDashboard.thisWeek")}
								</p>
							</div>
							<div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
								<Clock className="w-6 h-6 text-secondary" />
							</div>
						</div>
					</Card>

					<Card>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									💰 {t("therapistDashboard.monthlyRevenue")}
								</p>
								<p className="text-2xl font-bold">
									{formatCurrency(monthlyRevenue)}
								</p>
								<p className="text-sm text-muted-foreground mt-1">
									{t("therapistDashboard.sessionsThisMonth", { count: monthlySessionsCount })}
								</p>
							</div>
							<div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
								<DollarSign className="w-6 h-6 text-green-600" />
							</div>
						</div>
					</Card>

					<Card>
						<div className="flex items-start justify-between">
							<div>
								<p className="text-muted-foreground text-sm mb-1">
									👥 {t("therapistDashboard.activeClients")}
								</p>
								<p className="text-3xl font-bold">{totalClients}</p>
								<p className="text-sm text-muted-foreground mt-1">
									{t("therapistDashboard.totalUnique")}
								</p>
							</div>
							<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
								<Users className="w-6 h-6 text-blue-600" />
							</div>
						</div>
					</Card>
				</div>

				{/* Quick Actions */}
				<div className="grid md:grid-cols-3 gap-4 mb-8">
					<Link to="/therapist/schedule">
						<Card className="hover:border-primary transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
									<Calendar className="w-5 h-5 text-primary" />
								</div>
								<div>
									<p className="font-semibold">🗓️ {t("therapistDashboard.manageSchedule")}</p>
									<p className="text-sm text-muted-foreground">
										{t("therapistDashboard.manageScheduleDesc")}
									</p>
								</div>
							</div>
						</Card>
					</Link>

					<Link to="/therapist/sessions">
						<Card className="hover:border-primary transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center">
									<Clock className="w-5 h-5 text-secondary" />
								</div>
								<div>
									<p className="font-semibold">📋 {t("therapistDashboard.viewSessions")}</p>
									<p className="text-sm text-muted-foreground">
										{t("therapistDashboard.viewSessionsDesc")}
									</p>
								</div>
							</div>
						</Card>
					</Link>

					<Link to="/therapist/profile">
						<Card className="hover:border-primary transition-colors cursor-pointer">
							<div className="flex items-center gap-3">
								<div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
									<User className="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<p className="font-semibold">👤 {t("therapistDashboard.myProfile")}</p>
									<p className="text-sm text-muted-foreground">
										{t("therapistDashboard.myProfileDesc")}
									</p>
								</div>
							</div>
						</Card>
					</Link>
				</div>

				<div className="grid lg:grid-cols-3 gap-6">
					{/* Today's Sessions */}
					<div className="lg:col-span-2">
						<h2 className="text-xl font-semibold mb-4">☀️ {t("therapistDashboard.todaySessionsTitle")}</h2>

						<div className="space-y-4">
							{todaySessions.length === 0 ? (
								<Card>
									<div className="text-center py-8">
										<Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
										<p className="text-muted-foreground">
											{t("therapistDashboard.noTodaySessions")}
										</p>
									</div>
								</Card>
							) : (
								todaySessions.map((session) => (
									<Card
										key={session.internal_id}
										className="hover:border-primary transition-colors"
									>
										<div className="flex items-start justify-between mb-3">
											<div>
												<h3 className="font-semibold mb-1">
													{session.patient_name}
												</h3>
												<div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1">
													<Mail className="w-3.5 h-3.5" />
													<span>{session.patient_email}</span>
												</div>
												<p className="text-sm text-primary">
													{t("therapistDashboard.therapySession")}
												</p>
											</div>
											<Badge variant={getStatusBadge(session.status).variant}>
												{getStatusBadge(session.status).label}
											</Badge>
										</div>

										<div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
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
													{t("therapistDashboard.viewDetails")}
												</Button>
											</Link>
											{session.status.toLowerCase() === "scheduled" && (
												<Button
													size="sm"
													className="flex-1"
													onClick={async () => {
														try {
															await axios.post(
																`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${session.internal_id}/confirm/`,
																{},
																{
																	headers: {
																		Authorization: `Bearer ${localStorage.getItem("access_token")}`,
																	},
																},
															);
															setAppointments(
																appointments.map((a) =>
																	a.internal_id === session.internal_id
																		? { ...a, status: "confirmed" }
																		: a,
																),
															);
														} catch (error) {
															alert(t("therapistDashboard.confirmError"));
														}
													}}
												>
													{t("therapistDashboard.acceptAppointment")}
												</Button>
											)}

											{session.status.toLowerCase() === "confirmed" &&
												new Date(session.start_datetime) < new Date() && (
													<Button
														size="sm"
														className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
														onClick={async () => {
															try {
																await axios.post(
																	`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v1/agenda/appointments/${session.internal_id}/complete/`,
																	{},
																	{
																		headers: {
																			Authorization: `Bearer ${localStorage.getItem("access_token")}`,
																		},
																	},
																);
																setAppointments(
																	appointments.map((a) =>
																		a.internal_id === session.internal_id
																			? { ...a, status: "completed" }
																			: a,
																	),
																);
															} catch (error) {
																alert(t("therapistDashboard.completeError"));
															}
														}}
													>
														{t("therapistDashboard.completed")}
													</Button>
												)}
										</div>
									</Card>
								))
							)}
						</div>
					</div>

					{/* Upcoming Sessions */}
					<div>
						<h2 className="text-xl font-semibold mb-4">🔜 {t("therapistDashboard.upcomingSessions")}</h2>

						<div className="space-y-3">
							{upcomingSessions.slice(0, 5).map((session) => (
								<Link
									key={session.internal_id}
									to={`/session/${session.internal_id}`}
								>
									<Card className="p-4 hover:border-primary hover:-translate-y-0.5 transition-all cursor-pointer">
										<div className="flex items-start justify-between mb-2">
											<div>
												<p className="font-semibold text-sm">
													{session.patient_name}
												</p>
												<p className="text-xs text-muted-foreground">
													{t("therapistDashboard.therapySession")}
												</p>
											</div>
											<Badge
												variant={getStatusBadge(session.status).variant}
												className="text-xs"
											>
												{getStatusBadge(session.status).label}
											</Badge>
										</div>
										<div className="flex items-center gap-3 text-xs text-muted-foreground">
											<span>
												{new Date(session.start_datetime).toLocaleDateString(
													"es-ES",
													{
														month: "short",
														day: "numeric",
													},
												)}
											</span>
											<span>•</span>
											<span>
												{new Date(session.start_datetime).toLocaleTimeString(
													[],
													{ hour: "2-digit", minute: "2-digit" },
												)}
											</span>
										</div>
									</Card>
								</Link>
							))}

							{upcomingSessions.length === 0 && (
								<Card>
									<div className="text-center py-8">
										<Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
										<p className="text-sm text-muted-foreground">
											{t("therapistDashboard.noUpcoming")}
										</p>
									</div>
								</Card>
							)}

							{upcomingSessions.length > 5 && (
								<Link to="/therapist/sessions">
									<Button variant="outline" size="sm" className="w-full">
										{t("therapistDashboard.viewAll")}
									</Button>
								</Link>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

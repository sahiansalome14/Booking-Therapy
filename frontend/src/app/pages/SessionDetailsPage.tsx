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
	ShoppingBag,
	Sparkles,
	ExternalLink,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { type Appointment, agendaService } from "../../services/agenda";
import { therapistService } from "../../services/therapist";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { useAuth } from "../context/AuthContext";

export default function SessionDetailsPage() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const { user } = useAuth();
	const { t, i18n } = useTranslation();
	const [appointment, setAppointment] = useState<Appointment | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
	const [isProductsLoading, setIsProductsLoading] = useState(false);

	useEffect(() => {
		const fetchSession = async () => {
			if (!id) return;
			try {
				const session = await agendaService.getAppointmentById(id);
				setAppointment(session);

				// Consultar recomendaciones del socio de ropa basadas en la especialidad del terapeuta
				if (session.therapist_id) {
					setIsProductsLoading(true);
					try {
						const therapist = await therapistService.getById(session.therapist_id);
						const products = await therapistService.getProductRecommendations(therapist.specialty || "masaje");
						setRecommendedProducts(products);
					} catch (prodError) {
						console.error("Error fetching recommended products:", prodError);
					} finally {
						setIsProductsLoading(false);
					}
				}
			} catch (error) {
				console.error("Error fetching session details:", error);
			} finally {
				setIsLoading(false);
			}
		};
		fetchSession();
	}, [id]);

	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat(i18n.language === "es" ? "es-CO" : "en-US", {
			style: "currency",
			currency: i18n.language === "es" ? "COP" : "USD",
			minimumFractionDigits: 0,
		}).format(amount);
	};

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

	if (!appointment) {
		return (
			<div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
				<h1 className="text-2xl font-bold mb-4">{t("details.sessionNotFound")}</h1>
				<Button onClick={() => navigate(-1)}>{t("details.back")}</Button>
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
					<span>{t("details.backToDashboard")}</span>
				</button>

				<Card className="p-4 sm:p-8 shadow-xl border-blue-100 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full -mr-10 -mt-10" />

					<div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
						<div>
							<div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-2">
								<h1 className="text-2xl sm:text-3xl font-bold text-foreground">
									{t("details.title")}
								</h1>
								<Badge
									variant={getStatusBadge(appointment.status).variant}
									className="text-sm px-3 py-1"
								>
									{getStatusBadge(appointment.status).label}
								</Badge>
							</div>
							<p className="text-muted-foreground text-sm sm:text-base">
								{t("details.refId")}: {appointment.internal_id.split("-")[0]}
							</p>
						</div>
						<div className="text-left md:text-right">
							<p className="text-sm text-muted-foreground mb-1">
								{t("details.sessionCost")}
							</p>
							<p className="text-2xl sm:text-3xl font-bold text-primary">
								{formatCurrency(Number(appointment.price))}
							</p>
						</div>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
						<div className="space-y-8">
							<section>
								<h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
									{t("details.appointmentInfo")}
								</h2>
								<div className="space-y-4">
									<div className="flex items-center gap-3">
										<div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center text-blue-600">
											<Calendar className="w-5 h-5" />
										</div>
										<div>
											<p className="text-sm text-muted-foreground">{t("details.date")}</p>
											<p className="font-medium">
												{new Date(
													appointment.start_datetime,
												).toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", {
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
											<p className="text-sm text-muted-foreground">{t("details.time")}</p>
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
									{t("details.modality")}
								</h2>
								<div className="bg-muted/30 rounded-2xl p-6 border border-border/50">
									{appointment.modality === "VIRTUAL" ||
									!appointment.modality ? (
										<div className="space-y-4">
											<div className="flex items-center gap-3 text-primary">
												<Video className="w-6 h-6" />
												<span className="font-bold text-lg">
													{t("details.virtualSession")}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{t("details.virtualDesc")}
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
														{t("details.joinMeeting")}
													</Button>
												</a>
											) : (
												<div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-yellow-800 text-sm">
													{t("details.linkSoon")}
												</div>
											)}
										</div>
									) : (
										<div className="space-y-4">
											<div className="flex items-center gap-3 text-emerald-600">
												<MapPin className="w-6 h-6" />
												<span className="font-bold text-lg">
													{t("details.inPersonSession")}
												</span>
											</div>
											<p className="text-sm text-muted-foreground">
												{t("details.inPersonDesc")}
											</p>
											<div className="p-4 bg-white rounded-xl border border-emerald-100">
												<p className="text-sm font-medium mb-1">{t("details.address")}:</p>
												<p className="text-foreground">
													{appointment.therapist_location ||
														t("details.addressNotSpecified")}
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
									{t("details.participants")}
								</h2>
								<Card className="bg-muted/20 border-border/50 p-5 space-y-6">
									<div className="flex items-center gap-4">
										<div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center text-white shadow-md">
											<User className="w-6 h-6" />
										</div>
										<div>
											<p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">
												{t("details.therapist")}
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
												{t("details.patient")}
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
									{t("details.reminder")}
								</h2>
								<div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 space-y-3">
									<div className="flex items-center gap-2 text-blue-700 font-bold text-sm">
										<BadgeCheck className="w-4 h-4" />
										{t("details.recommendations")}
									</div>
									<ul className="text-xs text-blue-700/80 space-y-2 list-disc list-inside">
										{appointment.modality === "VIRTUAL" ||
										!appointment.modality ? (
											<>
												<li>
													{t("details.recVirtual1")}
												</li>
												<li>{t("details.recVirtual2")}</li>
												<li>
													{t("details.recVirtual3")}
												</li>
											</>
										) : (
											<>
												<li>{t("details.recInPerson1")}</li>
												<li>
													{t("details.recInPerson2")}
												</li>
												<li>
													{t("details.recInPerson3")}
												</li>
											</>
										)}
										<li>
											{t("details.recGeneral")}
										</li>
									</ul>
								</div>
							</section>
						</div>
					</div>

					{/* Productos Recomendados */}
					<div className="mt-10 pt-8 border-t border-border/80">
						<div className="flex items-center justify-between mb-6">
							<div>
								<div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-bold text-lg">
									<Sparkles className="w-5 h-5 text-violet-500 animate-pulse" />
									<h2>{i18n.language === "es" ? "Recomendaciones de Ropa para tu Sesión" : "Recommended Clothing for your Session"}</h2>
								</div>
								<p className="text-xs text-muted-foreground mt-1">
									{i18n.language === "es" 
										? "Indumentaria recomendada por nuestro socio aliado basada en tu tipo de terapia." 
										: "Recommended attire suggested by our ally partner based on your therapy type."}
								</p>
							</div>
							<ShoppingBag className="w-6 h-6 text-violet-500/80" />
						</div>

						{isProductsLoading ? (
							<div className="flex items-center justify-center py-8">
								<Loader2 className="w-8 h-8 animate-spin text-violet-500" />
								<span className="ml-2 text-sm text-muted-foreground">
									{i18n.language === "es" ? "Consultando tienda de ropa aliada..." : "Consulting allied clothing shop..."}
								</span>
							</div>
						) : recommendedProducts.length > 0 ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
								{recommendedProducts.map((product) => (
									<div 
										key={product.product_id || product.name}
										className="group relative flex flex-col bg-gradient-to-b from-white to-slate-50/50 dark:from-slate-900 dark:to-slate-950 rounded-2xl border border-violet-100 dark:border-violet-950/40 p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
									>
										{product.is_eco_friendly && (
											<span className="absolute top-3 left-3 z-10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-900">
												🍃 Eco-friendly
											</span>
										)}
										<div className="aspect-[4/3] w-full rounded-xl bg-slate-100 overflow-hidden mb-3 relative">
											{product.cover_image_url ? (
												<img 
													src={product.cover_image_url} 
													alt={product.name}
													className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
												/>
											) : (
												<div className="w-full h-full flex items-center justify-center text-muted-foreground/40 bg-slate-100 dark:bg-slate-800">
													<ShoppingBag className="w-10 h-10" />
												</div>
											)}
										</div>
										<h3 className="font-bold text-sm text-foreground mb-1 group-hover:text-violet-600 transition-colors line-clamp-1">
											{product.name}
										</h3>
										<p className="text-xs text-muted-foreground line-clamp-2 flex-grow mb-3 leading-relaxed">
											{product.description}
										</p>
										<div className="flex items-center justify-between mt-auto pt-2 border-t border-border/50">
											<span className="font-extrabold text-sm text-violet-600 dark:text-violet-400">
												{formatCurrency(Number(product.unit_price))}
											</span>
											<a 
												href={product.purchase_url} 
												target="_blank" 
												rel="noopener noreferrer"
												className="inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg shadow-sm transition-all hover:shadow duration-200"
											>
												<span>{i18n.language === "es" ? "Comprar" : "Buy"}</span>
												<ExternalLink className="w-3 h-3" />
											</a>
										</div>
									</div>
								))}
							</div>
						) : (
							<div className="text-center py-6 border border-dashed border-border rounded-2xl bg-muted/20">
								<ShoppingBag className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
								<p className="text-xs text-muted-foreground">
									{i18n.language === "es" ? "No se encontraron recomendaciones para esta categoría de terapia." : "No recommendations found for this therapy category."}
								</p>
							</div>
						)}
					</div>

					<div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row flex-wrap gap-4">
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
											className="w-full sm:w-auto"
											onClick={async () => {
												try {
													await axios.post(
														`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v2/agenda/appointments/${appointment.internal_id}/confirm/`,
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
													alert(t("sessions.confirmError"));
												}
											}}
										>
											{t("sessions.acceptAppointment")}
										</Button>
									)}
									{canCancel && (
										<Button
											variant="destructive"
											className="w-full sm:w-auto"
											onClick={async () => {
												if (
													confirm(t("sessions.confirmCancel"))
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
														alert(t("sessions.cancelError"));
													}
												}
											}}
										>
											{t("clientDashboard.cancel")}
										</Button>
									)}
									{s === "confirmed" && isPast && user?.role === "therapist" && (
										<Button
											variant="primary"
											className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white"
											onClick={async () => {
												try {
													await axios.post(
														`${import.meta.env.VITE_BACKEND_URL || "http://localhost:8000"}/api/v2/agenda/appointments/${appointment.internal_id}/complete/`,
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
													alert(t("sessions.completeError"));
												}
											}}
										>
											{t("sessions.markCompleted")}
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

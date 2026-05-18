import {
	Award,
	Calendar as CalendarIcon,
	Clock,
	Loader2,
	MapPin,
	Star,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { agendaService, type Slot } from "../../services/agenda";
import { type Therapist, therapistService } from "../../services/therapist";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Card } from "../components/Card";

export default function TherapistProfile() {
	const { id } = useParams();
	const [searchParams] = useSearchParams();
	const { t, i18n } = useTranslation();
	const [therapist, setTherapist] = useState<Therapist | null>(null);
	const [isLoadingTherapist, setIsLoadingTherapist] = useState(true);

	const formatDateLocal = (date: Date) => {
		const year = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, "0");
		const day = String(date.getDate()).padStart(2, "0");
		return `${year}-${month}-${day}`;
	};

	const [selectedDate, setSelectedDate] = useState<string>(
		formatDateLocal(new Date()),
	);
	const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
	const [slots, setSlots] = useState<Slot[]>([]);
	const [isLoadingSlots, setIsLoadingSlots] = useState(false);

	useEffect(() => {
		const fetchTherapist = async () => {
			if (!id) return;
			try {
				console.log("Fetching therapist with id:", id);
				const data = await therapistService.getById(id);
				console.log("Therapist data received:", data);
				setTherapist(data);
			} catch (error) {
				console.error("Error fetching therapist:", error);
			} finally {
				setIsLoadingTherapist(false);
			}
		};
		fetchTherapist();
	}, [id]);

	const fetchSlots = useCallback(async () => {
		if (!id) return;
		setIsLoadingSlots(true);
		try {
			console.log(
				"Fetching slots for therapist:",
				id,
				"on date:",
				selectedDate,
			);
			const data = await agendaService.getSlots(id, selectedDate);
			console.log("Slots received:", data);
			setSlots(data);
		} catch (error) {
			console.error("Error fetching slots:", error);
		} finally {
			setIsLoadingSlots(false);
		}
	}, [id, selectedDate]);

	useEffect(() => {
		if (therapist) {
			fetchSlots();
		}
	}, [fetchSlots, therapist]);

	if (isLoadingTherapist) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-12 h-12 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!therapist) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<h2 className="text-2xl font-bold mb-2">{t("booking.therapistNotFound")}</h2>
					<Link to="/search">
						<Button>{t("booking.backToSearch")}</Button>
					</Link>
				</div>
			</div>
		);
	}

	const generateDates = () => {
		const dates = [];
		const today = new Date();
		for (let i = 0; i < 7; i++) {
			const date = new Date();
			date.setDate(today.getDate() + i);
			dates.push({
				full: formatDateLocal(date),
				day: date.toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", { weekday: "short" }),
				date: date.getDate(),
				month: date.toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", { month: "short" }),
			});
		}
		return dates;
	};

	const dates = generateDates();

	const handleBooking = () => {
		if (selectedDate && selectedSlot) {
			// Navigate to booking flow with date and time
			window.location.href = `/booking/${therapist.id}?date=${selectedDate}&time=${selectedSlot.start}`;
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
			<div className="container mx-auto px-6">
				<Link
					to="/search"
					className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors group"
				>
					←{" "}
					<span className="group-hover:-translate-x-1 transition-transform">
						{t("booking.backToSearch")}
					</span>
				</Link>

				<div className="grid lg:grid-cols-3 gap-8">
					<div className="lg:col-span-1">
						<div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5 sticky top-24">
							<div className="text-center mb-6">
								<div className="relative inline-block">
									<img
										src={therapist.image}
										alt={therapist.name}
										className="w-32 h-32 rounded-full mx-auto mb-4 object-cover border-4 border-blue-100 shadow-xl"
									/>
									<div className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white p-2 rounded-full shadow-lg">
										<Star className="w-5 h-5 fill-white" />
									</div>
								</div>
								<h2 className="text-2xl font-bold mb-2">{therapist.name}</h2>
								<p className="text-blue-600 font-medium mb-3">
									{therapist.specialty}
								</p>

								<div className="flex items-center justify-center gap-2 mb-4">
									<div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1.5 rounded-full border border-yellow-200">
										<Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
										<span className="font-bold">{therapist.rating}</span>
									</div>
									<span className="text-muted-foreground text-sm">
										({therapist.reviews} {t("search.reviews")})
									</span>
								</div>

								<div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl text-white shadow-lg mb-2">
									<div className="text-3xl font-bold">
										{therapist.currency || "COP"}{" "}
										{therapist.price.toLocaleString(i18n.language === "es" ? "es-CO" : "en-US")}
									</div>
									<div className="text-sm opacity-90">{t("therapistProfile.perSession")}</div>
								</div>
							</div>

							<div className="space-y-4 border-t border-blue-100 pt-6">
								<div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
									<Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-semibold text-sm">{t("therapistProfile.experience")}</p>
										<p className="text-muted-foreground text-sm">
											{therapist.experience}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-50/50 hover:bg-cyan-50 transition-colors">
									<Clock className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-semibold text-sm">{t("therapistProfile.duration")}</p>
										<p className="text-muted-foreground text-sm">
											{therapist.session_duration || 45} {t("therapistProfile.minutes")}
										</p>
									</div>
								</div>

								<div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
									<MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
									<div>
										<p className="font-semibold text-sm">{t("sessions.location")}</p>
										<p className="text-muted-foreground text-sm">
											{therapist.location || t("therapistProfile.onlineOrNotSpecified")}
										</p>
									</div>
								</div>
							</div>
						</div>
					</div>

					<div className="lg:col-span-2 space-y-6">
						{/* Bio */}
						<div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
							<h3 className="text-xl font-bold mb-4">👤 {t("therapistProfile.aboutMe")}</h3>
							<p className="text-muted-foreground leading-relaxed">
								{therapist.bio}
							</p>
						</div>

						{/* Calendar */}
						<div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
							<div className="flex items-center gap-2 mb-6">
								<CalendarIcon className="w-5 h-5 text-blue-600" />
								<h3 className="text-xl font-bold">📅 {t("therapistProfile.availability")}</h3>
							</div>

							{/* Date Selection */}
							<div className="mb-6">
								<h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
									{t("therapistProfile.selectDate")}
								</h4>
								<div className="grid grid-cols-7 gap-2">
									{dates.map((date) => (
										<button
											key={date.full}
											onClick={() => {
												setSelectedDate(date.full);
												setSelectedSlot(null);
											}}
											className={`p-3 border-2 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
												selectedDate === date.full
													? "border-blue-600 bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
													: "border-blue-100 hover:border-blue-300 hover:bg-blue-50"
											}`}
										>
											<div className="text-xs uppercase font-medium">
												{date.day}
											</div>
											<div className="text-lg font-bold">{date.date}</div>
											<div className="text-xs">{date.month}</div>
										</button>
									))}
								</div>
							</div>

							{/* Time Slots */}
							{selectedDate && (
								<div>
									<h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">
										{t("therapistProfile.availableTimes")}
									</h4>
									{isLoadingSlots ? (
										<div className="flex justify-center py-8">
											<Loader2 className="w-8 h-8 animate-spin text-primary" />
										</div>
									) : (
										<div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
											{slots.map((slot) => {
												const isSelected = selectedSlot?.start === slot.start;

												return (
													<button
														key={slot.start}
														onClick={() => setSelectedSlot(slot)}
														className={`p-3 border-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
															isSelected
																? "border-blue-600 bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105"
																: "border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105"
														}`}
													>
														{slot.start}
													</button>
												);
											})}
										</div>
									)}

									{!isLoadingSlots && slots.length === 0 && (
										<p className="text-muted-foreground text-sm text-center py-4">
											{t("therapistProfile.noAvailableTimes")}
										</p>
									)}
								</div>
							)}

							{!selectedDate && (
								<div className="text-center py-12 text-muted-foreground bg-blue-50/50 rounded-xl">
									{t("therapistProfile.selectDateToSeeTimes")}
								</div>
							)}

							{/* Booking Button */}
							{selectedDate && selectedSlot && (
								<div className="mt-6 pt-6 border-t border-blue-100">
									<div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
										<div>
											<p className="text-sm text-muted-foreground mb-1">
												{t("therapistProfile.selectedSession")}
											</p>
											<p className="font-bold text-lg">
												{(() => {
													const [year, month, day] = selectedDate
														.split("-")
														.map(Number);
													const d = new Date(year, month - 1, day);
													return d.toLocaleDateString(i18n.language === "es" ? "es-ES" : "en-US", {
														weekday: "long",
														day: "numeric",
														month: "long",
													});
												})()} - {selectedSlot.start}
											</p>
										</div>
										<div className="text-right">
											<p className="text-sm text-muted-foreground mb-1">
												{t("therapistProfile.total")}
											</p>
											<p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
												{therapist.currency || "COP"}{" "}
												{therapist.price.toLocaleString(i18n.language === "es" ? "es-CO" : "en-US")}
											</p>
										</div>
									</div>
									<Button
										variant="gradient"
										size="lg"
										className="w-full shadow-2xl"
										onClick={handleBooking}
									>
										{t("therapistProfile.bookSession")}
									</Button>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

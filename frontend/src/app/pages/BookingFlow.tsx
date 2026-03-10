import {
	AlertCircle,
	Calendar,
	Check,
	CheckCircle2,
	CreditCard,
	Loader2,
	User,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import {
	Link,
	useNavigate,
	useParams,
	useSearchParams,
} from "react-router-dom";
import { agendaService } from "../../services/agenda";
import { Order, type OrderItem, orderService } from "../../services/order";
import { type Therapist, therapistService } from "../../services/therapist";
import { Button } from "../components/Button";

export default function BookingFlow() {
	const { therapistId } = useParams();
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();
	const date = searchParams.get("date") || "";
	const time = searchParams.get("time") || "";

	const [therapist, setTherapist] = useState<Therapist | null>(null);
	const [currentStep, setCurrentStep] = useState(1);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		phone: "",
		paymentMethod: "card",
		modality: "VIRTUAL",
		cardNumber: "",
		cardExpiry: "",
		cardCvv: "",
	});
	const [bookingError, setBookingError] = useState("");
	const [bookingSuccess, setBookingSuccess] = useState(false);
	const [confirmedAppointment, setConfirmedAppointment] = useState<any>(null);

	useEffect(() => {
		const fetchTherapist = async () => {
			if (!therapistId) return;
			try {
				const data = await therapistService.getById(therapistId);
				setTherapist(data);
			} catch (error) {
				setBookingError("No se pudo cargar la información del terapeuta");
			} finally {
				setIsLoading(false);
			}
		};
		fetchTherapist();
	}, [therapistId]);

	if (isLoading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!therapist) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center">
					<AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
					<p className="text-xl font-bold">Terapeuta no encontrado</p>
					<Link
						to="/search"
						className="text-blue-600 hover:underline mt-4 block"
					>
						Volver a la búsqueda
					</Link>
				</div>
			</div>
		);
	}

	const steps = [
		{ number: 1, title: "Confirmar", icon: Calendar },
		{ number: 2, title: "Datos", icon: User },
		{ number: 3, title: "Pago", icon: CreditCard },
		{ number: 4, title: "Confirmación", icon: CheckCircle2 },
	];

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData({ ...formData, [e.target.name]: e.target.value });
		setBookingError("");
	};

	const validateStep = (step: number) => {
		if (step === 2) {
			if (!formData.name || !formData.email || !formData.phone) {
				setBookingError("Por favor completa todos los campos");
				return false;
			}
		}
		if (step === 3) {
			if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv) {
				setBookingError("Por favor completa los datos de pago");
				return false;
			}
			if (formData.cardNumber.replace(/\s/g, "").length < 16) {
				setBookingError("Número de tarjeta inválido");
				return false;
			}
		}
		return true;
	};

	const handleNext = async () => {
		if (validateStep(currentStep)) {
			if (currentStep === 3) {
				setIsProcessing(true);
				try {
					if (!therapistId || !date || !time)
						throw new Error("Datos de reserva faltantes");

					const orderItems: OrderItem[] = [
						{
							type: "session",
							id: therapistId,
							name: `Sesión con ${therapist.name}`,
							price: therapist.price,
							quantity: 1,
							metadata: { date, time },
						},
					];

					const order = orderService.createOrderObject(
						orderItems,
						{
							name: formData.name,
							email: formData.email,
							phone: formData.phone,
						},
						formData.paymentMethod,
					);

					// ACTUAL RESERVATION CALL
					const appointment = await agendaService.createAppointment({
						therapist_id: therapistId!,
						target_date: date,
						start_time: time,
						modality: formData.modality,
						patient_name: formData.name,
						patient_email: formData.email,
						patient_phone: formData.phone,
						payment_info: {
							method: formData.paymentMethod,
							card_last4: formData.cardNumber.slice(-4),
						},
					});

					setConfirmedAppointment(appointment);
					setBookingSuccess(true);
					setCurrentStep(4);
				} catch (error: any) {
					setBookingError(
						error.response?.data?.detail ||
							"Error al procesar la reserva. Puede que el slot ya no esté disponible.",
					);
				} finally {
					setIsProcessing(false);
				}
			} else {
				setCurrentStep(currentStep + 1);
				setBookingError("");
			}
		}
	};

	const handleBack = () => {
		setCurrentStep(currentStep - 1);
		setBookingError("");
	};

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
			<div className="container mx-auto px-6 max-w-4xl">
				{/* Progress Steps */}
				<div className="mb-12">
					<div className="flex items-center justify-between relative">
						{steps.map((step, index) => (
							<React.Fragment key={step.number}>
								<div className="flex flex-col items-center relative z-10">
									<div
										className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 ${
											currentStep > step.number
												? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30"
												: currentStep === step.number
													? "bg-gradient-to-br from-blue-600 to-cyan-600 text-white ring-4 ring-blue-200 shadow-xl shadow-blue-500/40 scale-110"
													: "bg-gray-100 text-gray-400"
										}`}
									>
										{currentStep > step.number ? (
											<Check className="w-7 h-7" />
										) : (
											<step.icon className="w-7 h-7" />
										)}
									</div>
									<span
										className={`text-sm font-semibold ${
											currentStep >= step.number
												? "text-foreground"
												: "text-muted-foreground"
										}`}
									>
										{step.title}
									</span>
								</div>
								{index < steps.length - 1 && (
									<div
										className={`flex-1 h-1 mx-4 -mt-6 rounded-full transition-all duration-300 ${
											currentStep > step.number
												? "bg-gradient-to-r from-blue-600 to-cyan-600"
												: "bg-gray-200"
										}`}
									/>
								)}
							</React.Fragment>
						))}
					</div>
				</div>

				{/* Error Message */}
				{bookingError && (
					<div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-4">
						<AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
						<div>
							<p className="font-bold text-red-900">Error en la reserva</p>
							<p className="text-red-700 text-sm">{bookingError}</p>
						</div>
					</div>
				)}

				{/* Step Content */}
				<div className="bg-white border border-blue-100 rounded-3xl p-8 mb-8 shadow-2xl shadow-blue-500/5 backdrop-blur-sm bg-white/80">
					{/* Step 1 */}
					{currentStep === 1 && (
						<div className="animate-in fade-in slide-in-from-right-4">
							<h2 className="text-3xl font-bold mb-8 text-slate-800">
								Confirma los detalles
							</h2>
							<div className="grid md:grid-cols-5 gap-8">
								<div className="md:col-span-2">
									<div className="relative group">
										<img
											src={therapist.image}
											alt={therapist.name}
											className="w-full aspect-square rounded-3xl object-cover border-4 border-white shadow-xl transition-transform group-hover:rotate-1"
										/>
										<div className="absolute -bottom-4 -right-4 w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
											<Check className="w-6 h-6" />
										</div>
									</div>
								</div>
								<div className="md:col-span-3 space-y-6">
									<div>
										<h3 className="text-2xl font-bold text-slate-900">
											{therapist.name}
										</h3>
										<p className="text-blue-600 font-semibold text-lg">
											{therapist.specialty}
										</p>
									</div>

									<div className="grid gap-4">
										<div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
											<Calendar className="w-6 h-6 text-blue-600" />
											<div>
												<p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
													Fecha y Hora
												</p>
												<p className="font-bold text-slate-800">
													{(() => {
														const [year, month, day] = date
															.split("-")
															.map(Number);
														const d = new Date(year, month - 1, day);
														return d.toLocaleDateString("es-ES", {
															weekday: "long",
															month: "long",
															day: "numeric",
														});
													})()} • {time}
												</p>
											</div>
										</div>

										<div className="space-y-3">
											<p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
												Modalidad de la sesión
											</p>
											<div className="grid grid-cols-2 gap-3">
												<button
													onClick={() =>
														setFormData({ ...formData, modality: "VIRTUAL" })
													}
													className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.modality === "VIRTUAL" ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-blue-200"}`}
												>
													<Loader2
														className={`w-5 h-5 ${formData.modality === "VIRTUAL" ? "text-blue-600" : "text-slate-400"}`}
													/>
													<span
														className={`text-sm font-bold ${formData.modality === "VIRTUAL" ? "text-blue-900" : "text-slate-600"}`}
													>
														Virtual
													</span>
												</button>
												<button
													onClick={() =>
														setFormData({ ...formData, modality: "PRESENCIAL" })
													}
													className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formData.modality === "PRESENCIAL" ? "border-blue-600 bg-blue-50" : "border-slate-100 hover:border-blue-200"}`}
												>
													<User
														className={`w-5 h-5 ${formData.modality === "PRESENCIAL" ? "text-blue-600" : "text-slate-400"}`}
													/>
													<span
														className={`text-sm font-bold ${formData.modality === "PRESENCIAL" ? "text-blue-900" : "text-slate-600"}`}
													>
														Presencial
													</span>
												</button>
											</div>
										</div>

										<div className="flex items-center justify-between p-6 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl text-white shadow-lg shadow-blue-200">
											<div>
												<p className="text-blue-100 text-sm font-medium">
													Inversión de la sesión
												</p>
												<p className="text-4xl font-extrabold">
													{therapist.currency || "COP"}{" "}
													{therapist.price.toLocaleString("es-CO")}
												</p>
											</div>
											<div className="text-right">
												<p className="text-blue-100 text-sm font-medium">
													Duración
												</p>
												<p className="text-xl font-bold">
													{therapist.session_duration || 45} min
												</p>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* Step 2 */}
					{currentStep === 2 && (
						<div className="animate-in fade-in slide-in-from-right-4">
							<h2 className="text-2xl font-bold mb-6">Ingresa tus datos</h2>
							<div className="space-y-6">
								<div className="grid md:grid-cols-2 gap-6">
									<div>
										<label className="block text-sm font-bold text-slate-700 mb-2">
											Nombre completo
										</label>
										<input
											type="text"
											name="name"
											value={formData.name}
											onChange={handleInputChange}
											className="w-full px-5 py-4 border-2 border-slate-100 rounded-2x focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all font-medium"
											placeholder="Ej. María García"
										/>
									</div>
									<div>
										<label className="block text-sm font-bold text-slate-700 mb-2">
											Email
										</label>
										<input
											type="email"
											name="email"
											value={formData.email}
											onChange={handleInputChange}
											className="w-full px-5 py-4 border-2 border-slate-100 rounded-2x focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all font-medium"
											placeholder="ejemplo@correo.com"
										/>
									</div>
								</div>
								<div>
									<label className="block text-sm font-bold text-slate-700 mb-2">
										Teléfono
									</label>
									<input
										type="tel"
										name="phone"
										value={formData.phone}
										onChange={handleInputChange}
										className="w-full px-5 py-4 border-2 border-slate-100 rounded-2x focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all font-medium"
										placeholder="+52 55 1234 5678"
									/>
								</div>

								<div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex gap-4">
									<div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
										<AlertCircle className="w-6 h-6 text-blue-600" />
									</div>
									<p className="text-sm text-blue-900 leading-relaxed font-medium">
										Utilizaremos estos datos para enviarte el recordatorio de tu
										sesión y el enlace de la videollamada.
									</p>
								</div>
							</div>
						</div>
					)}

					{/* Step 3 */}
					{currentStep === 3 && (
						<div className="animate-in fade-in slide-in-from-right-4">
							<h2 className="text-2xl font-bold mb-8">Método de pago</h2>
							<div className="space-y-8">
								<div className="grid grid-cols-2 gap-6">
									<button
										onClick={() =>
											setFormData({ ...formData, paymentMethod: "card" })
										}
										className={`p-8 border-2 rounded-3xl transition-all relative overflow-hidden group ${
											formData.paymentMethod === "card"
												? "border-blue-600 bg-blue-50 shadow-xl shadow-blue-500/10"
												: "border-slate-100 hover:border-blue-200"
										}`}
									>
										<CreditCard
											className={`w-8 h-8 mx-auto mb-3 ${formData.paymentMethod === "card" ? "text-blue-600" : "text-slate-400"}`}
										/>
										<p
											className={`text-sm font-bold ${formData.paymentMethod === "card" ? "text-blue-900" : "text-slate-600"}`}
										>
											Tarjeta
										</p>
										{formData.paymentMethod === "card" && (
											<div className="absolute top-2 right-2">
												<CheckCircle2 className="w-5 h-5 text-blue-600" />
											</div>
										)}
									</button>
									<button
										disabled
										className="p-8 border-2 border-slate-50 rounded-3xl opacity-50 cursor-not-allowed bg-slate-25"
									>
										<div className="w-8 h-8 mx-auto mb-3 flex items-center justify-center font-bold text-slate-300">
											PP
										</div>
										<p className="text-sm font-bold text-slate-400">PayPal</p>
									</button>
								</div>

								{formData.paymentMethod === "card" && (
									<div className="space-y-6 pt-4 animate-in fade-in zoom-in-95">
										<div>
											<label className="block text-sm font-bold text-slate-700 mb-2">
												Número de tarjeta
											</label>
											<input
												type="text"
												name="cardNumber"
												value={formData.cardNumber}
												onChange={(e) => {
													const val = e.target.value
														.replace(/\D/g, "")
														.replace(/(.{4})/g, "$1 ")
														.trim();
													if (val.length <= 19)
														setFormData({ ...formData, cardNumber: val });
												}}
												className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all font-mono text-lg"
												placeholder="0000 0000 0000 0000"
											/>
										</div>

										<div className="grid grid-cols-2 gap-6">
											<div>
												<label className="block text-sm font-bold text-slate-700 mb-2">
													Expiración
												</label>
												<input
													type="text"
													name="cardExpiry"
													value={formData.cardExpiry}
													onChange={(e) => {
														let val = e.target.value.replace(/\D/g, "");
														if (val.length > 2)
															val =
																val.substring(0, 2) + "/" + val.substring(2, 4);
														if (val.length <= 5)
															setFormData({ ...formData, cardExpiry: val });
													}}
													className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all"
													placeholder="MM/AA"
												/>
											</div>
											<div>
												<label className="block text-sm font-bold text-slate-700 mb-2">
													CVV
												</label>
												<input
													type="text"
													name="cardCvv"
													value={formData.cardCvv}
													onChange={(e) => {
														const val = e.target.value.replace(/\D/g, "");
														if (val.length <= 4)
															setFormData({ ...formData, cardCvv: val });
													}}
													className="w-full px-5 py-4 border-2 border-slate-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-slate-50/50 transition-all"
													placeholder="123"
												/>
											</div>
										</div>
									</div>
								)}

								<div className="pt-8 border-t border-slate-100 flex items-center justify-between">
									<div>
										<span className="text-slate-500 font-medium">
											Total a pagar
										</span>
										<div className="flex items-center gap-2">
											<CheckCircle2 className="w-4 h-4 text-emerald-500" />
											<span className="text-xs text-emerald-600 font-bold uppercase tracking-wider">
												Pago Seguro
											</span>
										</div>
									</div>
									<span className="text-4xl font-extrabold text-slate-900">
										${therapist.price}
									</span>
								</div>
							</div>
						</div>
					)}

					{/* Step 4: Success */}
					{currentStep === 4 && bookingSuccess && (
						<div className="text-center py-12 animate-in fade-in zoom-in-95">
							<div className="relative inline-block mb-8">
								<div className="w-28 h-28 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/30 scale-125">
									<Check className="w-16 h-16 text-white" />
								</div>
								<div className="absolute inset-0 bg-emerald-400 rounded-full blur-3xl opacity-20 animate-pulse"></div>
							</div>

							<h2 className="text-4xl font-black mb-4 text-slate-800">
								¡Reserva confirmada!
							</h2>
							<p className="text-slate-500 text-lg mb-10 max-w-sm mx-auto">
								Hemos enviado los detalles y el enlace de acceso a{" "}
								<span className="font-bold text-slate-900">
									{formData.email}
								</span>
							</p>

							<div className="bg-slate-50 rounded-3xl p-8 mb-10 text-left max-w-md mx-auto border-2 border-white shadow-xl">
								<h3 className="font-bold mb-6 text-xl text-slate-800 flex items-center gap-2">
									<div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
									Ticket de Sesión
								</h3>
								<div className="space-y-4">
									<div className="flex justify-between items-center">
										<span className="text-slate-500 font-medium">ID Cita</span>
										<span className="font-mono text-sm bg-white px-3 py-1 rounded-lg border border-slate-100">
											{confirmedAppointment?.internal_id
												?.split("-")[0]
												.toUpperCase() || "RES-2024"}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-slate-500 font-medium">
											Terapeuta
										</span>
										<span className="font-bold text-slate-900">
											{therapist.name}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-slate-500 font-medium">Fecha</span>
										<span className="font-bold text-slate-900">
											{(() => {
												const [y, m, d] = date.split("-").map(Number);
												return new Date(y, m - 1, d).toLocaleDateString(
													"es-ES",
													{ month: "short", day: "numeric", year: "numeric" },
												);
											})()}
										</span>
									</div>
									<div className="flex justify-between items-center">
										<span className="text-slate-500 font-medium">Hora</span>
										<span className="font-bold text-blue-600">{time}</span>
									</div>
									<div className="pt-6 border-t border-slate-200 flex justify-between items-center">
										<span className="text-slate-500 font-medium">
											Estado del pago
										</span>
										<span className="px-4 py-1.5 bg-emerald-100 text-emerald-700 rounded-full text-sm font-black border border-emerald-200 uppercase tracking-tighter">
											Exitoso
										</span>
									</div>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link
									to={`/session/${confirmedAppointment?.internal_id}`}
									className="w-full sm:w-auto"
								>
									<Button
										variant="primary"
										className="w-full h-14 px-8 text-lg font-bold bg-blue-600 hover:bg-blue-700"
									>
										Ver Detalles de la Cita
									</Button>
								</Link>
								<Link to="/client/dashboard" className="w-full sm:w-auto">
									<Button
										variant="outline"
										className="w-full h-14 px-8 text-lg font-bold"
									>
										Ir al Dashboard
									</Button>
								</Link>
							</div>
						</div>
					)}
				</div>

				{currentStep < 4 && (
					<div className="flex justify-between items-center px-4">
						<Button
							variant="outline"
							onClick={handleBack}
							disabled={currentStep === 1 || isProcessing}
							className="h-14 px-8 text-lg font-bold border-2"
						>
							Regresar
						</Button>
						<Button
							variant="gradient"
							onClick={handleNext}
							disabled={isProcessing}
							className="h-14 px-12 text-lg font-bold shadow-xl shadow-blue-500/20 min-w-[200px]"
						>
							{isProcessing ? (
								<div className="flex items-center gap-2">
									<Loader2 className="w-5 h-5 animate-spin" />
									<span>Procesando...</span>
								</div>
							) : currentStep === 3 ? (
								"Confirmar y Pagar"
							) : (
								"Siguiente paso"
							)}
						</Button>
					</div>
				)}
			</div>
		</div>
	);
}

import React, { useState } from 'react';
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom';
import { Check, CreditCard, Calendar, User, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '../components/Button';
import { mockTherapists } from '../data/mockData';
import { agendaService } from '../../services/agenda';

export default function BookingFlow() {
  const { therapistId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const date = searchParams.get('date') || '';
  const time = searchParams.get('time') || '';

  const therapist = mockTherapists.find(t => t.id === therapistId);

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    name: 'María González',
    email: 'maria.gonzalez@email.com',
    phone: '+52 55 1234 5678',
    paymentMethod: 'card',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: ''
  });
  const [bookingError, setBookingError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  if (!therapist) {
    return <div className="min-h-screen bg-background flex items-center justify-center">
      <p>Terapeuta no encontrado</p>
    </div>;
  }

  const steps = [
    { number: 1, title: 'Confirmar', icon: Calendar },
    { number: 2, title: 'Datos', icon: User },
    { number: 3, title: 'Pago', icon: CreditCard },
    { number: 4, title: 'Confirmación', icon: CheckCircle2 }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setBookingError('');
  };

  const validateStep = (step: number) => {
    if (step === 2) {
      if (!formData.name || !formData.email || !formData.phone) {
        setBookingError('Por favor completa todos los campos');
        return false;
      }
    }
    if (step === 3) {
      if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvv) {
        setBookingError('Por favor completa los datos de pago');
        return false;
      }
      // Demo validation
      if (formData.cardNumber.length < 16) {
        setBookingError('Número de tarjeta inválido');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (validateStep(currentStep)) {
      if (currentStep === 3) {
        // ACTUAL RESERVATION CALL
        setIsProcessing(true);
        try {
          if (!therapistId || !date || !time) throw new Error("Datos de reserva faltantes");
          await agendaService.createAppointment({
            therapist_id: therapistId,
            target_date: date,
            start_time: time
          });
          setBookingSuccess(true);
          setCurrentStep(4);
        } catch (error: any) {
          setBookingError(error.response?.data?.detail || 'Error al procesar la reserva. Puede que el slot ya no esté disponible.');
        } finally {
          setIsProcessing(false);
        }
      } else {
        setCurrentStep(currentStep + 1);
        setBookingError('');
      }
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setBookingError('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
      <div className="container mx-auto px-6 max-w-4xl">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {steps.map((step, index) => (
              <React.Fragment key={step.number}>
                <div className="flex flex-col items-center relative z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-2 transition-all duration-300 ${currentStep > step.number
                    ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                    : currentStep === step.number
                      ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white ring-4 ring-blue-200 shadow-xl shadow-blue-500/40 scale-110'
                      : 'bg-gray-100 text-gray-400'
                    }`}>
                    {currentStep > step.number ? (
                      <Check className="w-7 h-7" />
                    ) : (
                      <step.icon className="w-7 h-7" />
                    )}
                  </div>
                  <span className={`text-sm font-semibold ${currentStep >= step.number ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-1 mx-4 -mt-6 rounded-full transition-all duration-300 ${currentStep > step.number ? 'bg-gradient-to-r from-blue-600 to-cyan-600' : 'bg-gray-200'
                    }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {bookingError && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Error en la reserva</p>
              <p className="text-red-700 text-sm">{bookingError}</p>
            </div>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white border border-blue-100 rounded-2xl p-8 mb-6 shadow-lg shadow-blue-500/5">
          {/* Step 1 */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Confirma los detalles de tu sesión</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <img
                    src={therapist.image}
                    alt={therapist.name}
                    className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-100"
                  />
                  <div>
                    <h3 className="font-bold text-lg">{therapist.name}</h3>
                    <p className="text-blue-600 font-medium">{therapist.specialty}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-200">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha</p>
                    <p className="font-bold">
                      {new Date(date).toLocaleDateString('es-ES', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hora</p>
                    <p className="font-bold">{time}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Duración</p>
                    <p className="font-bold">60 minutos</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Precio</p>
                    <p className="font-bold text-blue-600 text-2xl">${therapist.price}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2 */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Ingresa tus datos</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Nombre completo</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                    placeholder="Tu nombre completo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                    placeholder="tu@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Teléfono</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"
                    placeholder="+52 55 1234 5678"
                  />
                </div>

                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <p className="text-sm text-blue-900">
                    Recibirás un email de confirmación con los detalles de tu sesión
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Step 3 */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-6">Método de pago</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setFormData({ ...formData, paymentMethod: 'card' })}
                    className={`p-6 border-2 rounded-2xl transition-all ${formData.paymentMethod === 'card'
                      ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/20'
                      : 'border-blue-100 hover:border-blue-300'
                      }`}
                  >
                    <CreditCard className="w-7 h-7 mx-auto mb-2 text-blue-600" />
                    <p className="text-sm font-bold">Tarjeta</p>
                  </button>
                  <button
                    onClick={() => setFormData({ ...formData, paymentMethod: 'paypal' })}
                    className={`p-6 border-2 rounded-2xl transition-all ${formData.paymentMethod === 'paypal'
                      ? 'border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/20'
                      : 'border-blue-100 hover:border-blue-300'
                      }`}
                  >
                    <div className="w-7 h-7 mx-auto mb-2 flex items-center justify-center font-bold text-blue-600">
                      PP
                    </div>
                    <p className="text-sm font-bold">PayPal</p>
                  </button>
                </div>

                {formData.paymentMethod === 'card' && (
                  <div className="space-y-4 pt-4">
                    <div>
                      <label className="block text-sm font-semibold mb-2">Número de tarjeta</label>
                      <input
                        type="text"
                        name="cardNumber"
                        value={formData.cardNumber}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold mb-2">Expiración</label>
                        <input
                          type="text"
                          name="cardExpiry"
                          value={formData.cardExpiry}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="MM/AA"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold mb-2">CVV</label>
                        <input
                          type="text"
                          name="cardCvv"
                          value={formData.cardCvv}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                          placeholder="123"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-bold mb-1 text-emerald-900">Pago seguro</p>
                    <p className="text-emerald-700">
                      Tus datos están protegidos con encriptación SSL
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-blue-100 flex items-center justify-between">
                  <span className="font-bold text-lg">Total a pagar</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    ${therapist.price}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Success */}
          {currentStep === 4 && bookingSuccess && (
            <div className="text-center py-8">
              <div className="relative inline-block mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-emerald-500/40">
                  <CheckCircle2 className="w-14 h-14 text-white" />
                </div>
                <div className="absolute inset-0 bg-emerald-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
              </div>

              <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
                ¡Reserva confirmada!
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                Tu sesión ha sido reservada exitosamente
              </p>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-6 mb-8 text-left max-w-md mx-auto border border-blue-200">
                <h3 className="font-bold mb-4 text-lg">Detalles de tu sesión</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Terapeuta</span>
                    <span className="font-semibold">{therapist.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha</span>
                    <span className="font-semibold">
                      {new Date(date).toLocaleDateString('es-ES', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hora</span>
                    <span className="font-semibold">{time}</span>
                  </div>
                  <div className="flex justify-between items-center pt-3 border-t border-blue-200">
                    <span className="text-muted-foreground">Estado</span>
                    <span className="px-3 py-1 bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700 rounded-full text-sm font-bold border border-emerald-200">
                      Confirmada
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Link to="/client/dashboard">
                  <Button variant="gradient">Ver mi Dashboard</Button>
                </Link>
                <Link to="/search">
                  <Button variant="outline">Buscar más terapeutas</Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {currentStep < 4 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              Atrás
            </Button>
            <Button variant="gradient" onClick={handleNext} disabled={isProcessing}>
              {isProcessing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : currentStep === 3 ? (
                'Confirmar y Pagar'
              ) : (
                'Siguiente'
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

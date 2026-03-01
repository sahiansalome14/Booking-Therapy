import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Award, Clock, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { mockTherapists, generateTimeSlots } from '../data/mockData';

export default function TherapistProfile() {
  const { id } = useParams();
  const therapist = mockTherapists.find(t => t.id === id);
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');

  if (!therapist) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Terapeuta no encontrado</h2>
          <Link to="/search">
            <Button>Volver a búsqueda</Button>
          </Link>
        </div>
      </div>
    );
  }

  const generateDates = () => {
    const dates = [];
    const today = new Date('2026-02-21');
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      dates.push({
        full: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('es-ES', { month: 'short' })
      });
    }
    return dates;
  };

  const dates = generateDates();
  const timeSlots = selectedDate ? generateTimeSlots(therapist.id, selectedDate) : [];

  const handleBooking = () => {
    if (selectedDate && selectedTime) {
      // Navigate to booking flow
      window.location.href = `/booking/${therapist.id}?date=${selectedDate}&time=${selectedTime}`;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <Link to="/search" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 font-medium transition-colors group">
          ← <span className="group-hover:-translate-x-1 transition-transform">Volver a búsqueda</span>
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
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
                <p className="text-blue-600 font-medium mb-3">{therapist.specialty}</p>
                
                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-50 to-amber-50 px-3 py-1.5 rounded-full border border-yellow-200">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold">{therapist.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({therapist.reviews} reseñas)
                  </span>
                </div>

                <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-4 rounded-xl text-white shadow-lg mb-2">
                  <div className="text-3xl font-bold">
                    ${therapist.price}
                  </div>
                  <div className="text-sm opacity-90">por sesión</div>
                </div>
              </div>

              <div className="space-y-4 border-t border-blue-100 pt-6">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 transition-colors">
                  <Award className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Experiencia</p>
                    <p className="text-muted-foreground text-sm">{therapist.experience}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-cyan-50/50 hover:bg-cyan-50 transition-colors">
                  <Clock className="w-5 h-5 text-cyan-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Duración</p>
                    <p className="text-muted-foreground text-sm">60 minutos por sesión</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-emerald-50/50 hover:bg-emerald-50 transition-colors">
                  <MapPin className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-sm">Ubicación</p>
                    <p className="text-muted-foreground text-sm">Centro, Ciudad de México</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Calendar & Bio */}
          <div className="lg:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
              <h3 className="text-xl font-bold mb-4">Sobre mí</h3>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {therapist.bio}
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Mi enfoque se centra en proporcionar un ambiente seguro y profesional donde cada cliente pueda alcanzar sus objetivos de bienestar. Utilizo técnicas comprobadas y personalizadas para cada necesidad individual.
              </p>
            </div>

            {/* Calendar */}
            <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5">
              <div className="flex items-center gap-2 mb-6">
                <CalendarIcon className="w-5 h-5 text-blue-600" />
                <h3 className="text-xl font-bold">Disponibilidad</h3>
              </div>

              {/* Date Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Selecciona una fecha</h4>
                <div className="grid grid-cols-7 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date.full}
                      onClick={() => {
                        setSelectedDate(date.full);
                        setSelectedTime('');
                      }}
                      className={`p-3 border-2 rounded-xl text-center transition-all duration-200 hover:scale-105 ${
                        selectedDate === date.full
                          ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30'
                          : 'border-blue-100 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      <div className="text-xs uppercase font-medium">{date.day}</div>
                      <div className="text-lg font-bold">{date.date}</div>
                      <div className="text-xs">{date.month}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time Slots */}
              {selectedDate && (
                <div>
                  <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Horarios disponibles</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                    {timeSlots.map((slot) => (
                      <button
                        key={slot.id}
                        onClick={() => slot.available && setSelectedTime(slot.time)}
                        disabled={!slot.available}
                        className={`p-3 border-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                          !slot.available
                            ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                            : selectedTime === slot.time
                            ? 'border-blue-600 bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/30 scale-105'
                            : 'border-blue-200 hover:border-blue-400 hover:bg-blue-50 hover:scale-105'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                  
                  {timeSlots.filter(s => s.available).length === 0 && (
                    <p className="text-muted-foreground text-sm text-center py-4">
                      No hay horarios disponibles para esta fecha
                    </p>
                  )}
                </div>
              )}

              {!selectedDate && (
                <div className="text-center py-12 text-muted-foreground bg-blue-50/50 rounded-xl">
                  Selecciona una fecha para ver los horarios disponibles
                </div>
              )}

              {/* Booking Button */}
              {selectedDate && selectedTime && (
                <div className="mt-6 pt-6 border-t border-blue-100">
                  <div className="flex items-center justify-between mb-4 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl border border-blue-200">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Sesión seleccionada</p>
                      <p className="font-bold text-lg">
                        {new Date(selectedDate).toLocaleDateString('es-ES', { 
                          weekday: 'long', 
                          day: 'numeric',
                          month: 'long'
                        })} - {selectedTime}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                        ${therapist.price}
                      </p>
                    </div>
                  </div>
                  <Link to={`/booking/${therapist.id}?date=${selectedDate}&time=${selectedTime}`}>
                    <Button variant="gradient" size="lg" className="w-full shadow-2xl">
                      Reservar Sesión
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
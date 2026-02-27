import React, { useState } from 'react';
import { Plus, Lock, Unlock, Calendar as CalendarIcon } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { generateTimeSlots } from '../data/mockData';

export default function TherapistSchedule() {
  const [selectedDate, setSelectedDate] = useState('2026-02-24');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);

  const generateWeekDates = () => {
    const dates = [];
    const startDate = new Date('2026-02-23'); // Monday
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dates.push({
        full: date.toISOString().split('T')[0],
        day: date.toLocaleDateString('es-ES', { weekday: 'short' }),
        date: date.getDate(),
        month: date.toLocaleDateString('es-ES', { month: 'short' }),
        dayName: date.toLocaleDateString('es-ES', { weekday: 'long' })
      });
    }
    return dates;
  };

  const weekDates = generateWeekDates();
  const timeSlots = generateTimeSlots('1', selectedDate);

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestión de Agenda</h1>
            <p className="text-muted-foreground">Administra tu disponibilidad y horarios</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setShowBlockModal(true)}>
              <Lock className="w-4 h-4 mr-2" />
              Bloquear Horario
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Crear Slot
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card>
            <p className="text-muted-foreground text-sm mb-1">Slots Disponibles</p>
            <p className="text-2xl font-bold text-primary">24</p>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </Card>

          <Card>
            <p className="text-muted-foreground text-sm mb-1">Slots Ocupados</p>
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </Card>

          <Card>
            <p className="text-muted-foreground text-sm mb-1">Tasa de Ocupación</p>
            <p className="text-2xl font-bold text-green-600">67%</p>
            <p className="text-xs text-green-600 mt-1">↑ 5% vs semana anterior</p>
          </Card>

          <Card>
            <p className="text-muted-foreground text-sm mb-1">Horarios Bloqueados</p>
            <p className="text-2xl font-bold text-red-600">3</p>
            <p className="text-xs text-muted-foreground mt-1">Esta semana</p>
          </Card>
        </div>

        {/* Calendar View */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold">Vista Semanal</h2>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded"></div>
                <span>Disponible</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-muted rounded"></div>
                <span>Ocupado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-200 rounded"></div>
                <span>Bloqueado</span>
              </div>
            </div>
          </div>

          {/* Week Days Selector */}
          <div className="grid grid-cols-7 gap-2 mb-6">
            {weekDates.map((date) => (
              <button
                key={date.full}
                onClick={() => setSelectedDate(date.full)}
                className={`p-3 border rounded-lg text-center transition-colors ${
                  selectedDate === date.full
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:border-primary'
                }`}
              >
                <div className="text-xs uppercase font-medium">{date.day}</div>
                <div className="text-xl font-bold">{date.date}</div>
                <div className="text-xs">{date.month}</div>
              </button>
            ))}
          </div>

          {/* Time Slots Grid */}
          <div>
            <div className="mb-4 pb-3 border-b border-border">
              <h3 className="font-semibold">
                {weekDates.find(d => d.full === selectedDate)?.dayName}, {' '}
                {new Date(selectedDate).toLocaleDateString('es-ES', { 
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </h3>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-9 gap-3">
              {timeSlots.map((slot) => {
                const isBlocked = Math.random() < 0.1; // 10% blocked for demo
                const isOccupied = !slot.available;
                
                return (
                  <div
                    key={slot.id}
                    className={`relative p-3 border rounded-lg text-center transition-all ${
                      isBlocked
                        ? 'bg-red-50 border-red-200 cursor-not-allowed'
                        : isOccupied
                        ? 'bg-muted border-border cursor-default'
                        : 'bg-primary/5 border-primary hover:bg-primary hover:text-primary-foreground cursor-pointer'
                    }`}
                  >
                    <div className="font-semibold text-sm">{slot.time}</div>
                    <div className="text-xs mt-1">
                      {isBlocked ? (
                        <span className="text-red-600">Bloqueado</span>
                      ) : isOccupied ? (
                        <span className="text-muted-foreground">Ocupado</span>
                      ) : (
                        <span className="text-primary">Disponible</span>
                      )}
                    </div>
                    
                    {isBlocked && (
                      <Lock className="w-3 h-3 absolute top-1 right-1 text-red-600" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Create Slot Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Crear Nuevo Slot</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha</label>
                  <input
                    type="date"
                    defaultValue={selectedDate}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora inicio</label>
                    <input
                      type="time"
                      defaultValue="09:00"
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora fin</label>
                    <input
                      type="time"
                      defaultValue="10:00"
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded" defaultChecked />
                    <span className="text-sm">Repetir semanalmente</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Crear Slot
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Block Hours Modal */}
        {showBlockModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Bloquear Horario</h3>
                <button
                  onClick={() => setShowBlockModal(false)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Fecha</label>
                  <input
                    type="date"
                    defaultValue={selectedDate}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora inicio</label>
                    <input
                      type="time"
                      defaultValue="14:00"
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Hora fin</label>
                    <input
                      type="time"
                      defaultValue="16:00"
                      className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Motivo (opcional)</label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-input-background"
                    rows={3}
                    placeholder="Ej: Cita médica, vacaciones..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowBlockModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={() => setShowBlockModal(false)}
                  >
                    Bloquear
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

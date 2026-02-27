import React from 'react';
import { Link } from 'react-router';
import { Calendar, DollarSign, Users, TrendingUp, Clock } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { mockSessions } from '../data/mockData';

export default function TherapistDashboard() {
  // Mock data for therapist (Dr. Carlos Méndez - ID 1)
  const therapistSessions = mockSessions.filter(s => s.therapistId === '1');
  
  const todaySessions = therapistSessions.filter(s => 
    s.date === '2026-02-21' && (s.status === 'confirmed' || s.status === 'pending')
  );

  const upcomingSessions = therapistSessions.filter(s => 
    new Date(s.date) >= new Date('2026-02-21') && (s.status === 'confirmed' || s.status === 'pending')
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const monthlyRevenue = therapistSessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.price, 0);

  const totalClients = new Set(therapistSessions.map(s => s.clientId)).size;

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'warning' as const, label: 'Pendiente' },
      confirmed: { variant: 'success' as const, label: 'Confirmada' },
      completed: { variant: 'info' as const, label: 'Completada' },
      cancelled: { variant: 'danger' as const, label: 'Cancelada' }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Dashboard del Terapeuta</h1>
          <p className="text-muted-foreground">Bienvenido de vuelta, Dr. Carlos Méndez</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Sesiones Hoy</p>
                <p className="text-3xl font-bold">{todaySessions.length}</p>
                <p className="text-sm text-green-600 mt-1">↑ 2 vs ayer</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Próximas Sesiones</p>
                <p className="text-3xl font-bold">{upcomingSessions.length}</p>
                <p className="text-sm text-muted-foreground mt-1">Esta semana</p>
              </div>
              <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Ingresos del Mes</p>
                <p className="text-3xl font-bold">${monthlyRevenue}</p>
                <p className="text-sm text-green-600 mt-1">↑ 12% vs mes anterior</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Clientes Activos</p>
                <p className="text-3xl font-bold">{totalClients}</p>
                <p className="text-sm text-muted-foreground mt-1">Total únicos</p>
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
                  <p className="font-semibold">Gestionar Agenda</p>
                  <p className="text-sm text-muted-foreground">Ver y editar disponibilidad</p>
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
                  <p className="font-semibold">Ver Sesiones</p>
                  <p className="text-sm text-muted-foreground">Gestionar reservas</p>
                </div>
              </div>
            </Card>
          </Link>

          <Card className="hover:border-primary transition-colors cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-semibold">Ver Reportes</p>
                <p className="text-sm text-muted-foreground">Análisis e ingresos</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Today's Sessions */}
          <div className="lg:col-span-2">
            <h2 className="text-xl font-semibold mb-4">Sesiones de Hoy</h2>
            
            <div className="space-y-4">
              {todaySessions.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No tienes sesiones programadas para hoy</p>
                  </div>
                </Card>
              ) : (
                todaySessions.map(session => (
                  <Card key={session.id} className="hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{session.clientName}</h3>
                        <p className="text-sm text-primary">{session.specialty}</p>
                      </div>
                      <Badge variant={getStatusBadge(session.status).variant}>
                        {getStatusBadge(session.status).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${session.price}</span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-border">
                      <Button variant="outline" size="sm" className="flex-1">
                        Ver Detalles
                      </Button>
                      {session.status === 'pending' && (
                        <Button size="sm" className="flex-1">
                          Confirmar
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
            <h2 className="text-xl font-semibold mb-4">Próximas Sesiones</h2>
            
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map(session => (
                <Card key={session.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-sm">{session.clientName}</p>
                      <p className="text-xs text-muted-foreground">{session.specialty}</p>
                    </div>
                    <Badge variant={getStatusBadge(session.status).variant} className="text-xs">
                      {getStatusBadge(session.status).label}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>
                      {new Date(session.date).toLocaleDateString('es-ES', { 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </span>
                    <span>•</span>
                    <span>{session.time}</span>
                  </div>
                </Card>
              ))}

              {upcomingSessions.length === 0 && (
                <Card>
                  <div className="text-center py-8">
                    <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Sin sesiones próximas</p>
                  </div>
                </Card>
              )}

              {upcomingSessions.length > 5 && (
                <Link to="/therapist/sessions">
                  <Button variant="outline" size="sm" className="w-full">
                    Ver Todas
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

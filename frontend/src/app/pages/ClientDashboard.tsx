import React from 'react';
import { Link } from 'react-router';
import { Calendar, Clock, DollarSign, User } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { mockSessions } from '../data/mockData';

export default function ClientDashboard() {
  const upcomingSessions = mockSessions.filter(s => 
    s.status === 'confirmed' || s.status === 'pending'
  ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pastSessions = mockSessions.filter(s => 
    s.status === 'completed' || s.status === 'cancelled'
  ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const totalSpent = mockSessions
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.price, 0);

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
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
            Mi Dashboard
          </h1>
          <p className="text-muted-foreground text-lg">Bienvenida de vuelta, María</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-white border border-blue-100 rounded-2xl p-6 shadow-lg shadow-blue-500/5 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1 font-medium">Próximas Sesiones</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                  {upcomingSessions.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Calendar className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-cyan-100 rounded-2xl p-6 shadow-lg shadow-cyan-500/5 hover:shadow-xl hover:shadow-cyan-500/10 hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1 font-medium">Sesiones Totales</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                  {mockSessions.length}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-cyan-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30">
                <Clock className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-lg shadow-emerald-500/5 hover:shadow-xl hover:shadow-emerald-500/10 hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1 font-medium">Total Invertido</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                  ${totalSpent}
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-green-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <DollarSign className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-purple-100 rounded-2xl p-6 shadow-lg shadow-purple-500/5 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1 font-medium">Terapeutas</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  3
                </p>
              </div>
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                <User className="w-7 h-7 text-white" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Upcoming Sessions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Próximas Sesiones</h2>
              <Link to="/search">
                <Button variant="outline" size="sm">Reservar Nueva</Button>
              </Link>
            </div>

            <div className="space-y-4">
              {upcomingSessions.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground mb-4">No tienes sesiones próximas</p>
                    <Link to="/search">
                      <Button size="sm">Buscar Terapeutas</Button>
                    </Link>
                  </div>
                </Card>
              ) : (
                upcomingSessions.map(session => (
                  <Card key={session.id} className="hover:border-primary transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{session.therapistName}</h3>
                        <p className="text-sm text-primary">{session.specialty}</p>
                      </div>
                      <Badge variant={getStatusBadge(session.status).variant}>
                        {getStatusBadge(session.status).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(session.date).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
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
                        <Button variant="destructive" size="sm" className="flex-1">
                          Cancelar
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>

          {/* History & Payments */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Historial de Sesiones</h2>
            
            <div className="space-y-4">
              {pastSessions.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">No tienes historial aún</p>
                  </div>
                </Card>
              ) : (
                pastSessions.map(session => (
                  <Card key={session.id}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold mb-1">{session.therapistName}</h3>
                        <p className="text-sm text-primary">{session.specialty}</p>
                      </div>
                      <Badge variant={getStatusBadge(session.status).variant}>
                        {getStatusBadge(session.status).label}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(session.date).toLocaleDateString('es-ES', { 
                            month: 'short', 
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        <span>${session.price}</span>
                      </div>
                    </div>

                    {session.status === 'completed' && (
                      <div className="mt-3 pt-3 border-t border-border">
                        <Button variant="outline" size="sm" className="w-full">
                          Dejar Reseña
                        </Button>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
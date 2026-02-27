import React, { useState } from 'react';
import { Search, Filter, Calendar, Clock, DollarSign, User, CheckCircle2, X, RotateCcw } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { mockSessions } from '../data/mockData';

export default function TherapistSessions() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  // Mock data for therapist (Dr. Carlos Méndez - ID 1)
  const therapistSessions = mockSessions.filter(s => s.therapistId === '1');

  const filteredSessions = therapistSessions.filter(session => {
    const matchesStatus = statusFilter === 'all' || session.status === statusFilter;
    const matchesSearch = session.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: { variant: 'warning' as const, label: 'Pendiente', count: therapistSessions.filter(s => s.status === 'pending').length },
      confirmed: { variant: 'success' as const, label: 'Confirmada', count: therapistSessions.filter(s => s.status === 'confirmed').length },
      completed: { variant: 'info' as const, label: 'Completada', count: therapistSessions.filter(s => s.status === 'completed').length },
      cancelled: { variant: 'danger' as const, label: 'Cancelada', count: therapistSessions.filter(s => s.status === 'cancelled').length }
    };
    return variants[status as keyof typeof variants] || variants.pending;
  };

  const handleConfirm = (sessionId: string) => {
    // Handle confirm logic
    console.log('Confirming session:', sessionId);
  };

  const handleReschedule = (sessionId: string) => {
    // Handle reschedule logic
    console.log('Rescheduling session:', sessionId);
  };

  const handleCancel = (sessionId: string) => {
    // Handle cancel logic
    console.log('Cancelling session:', sessionId);
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gestión de Sesiones</h1>
          <p className="text-muted-foreground">Administra todas tus sesiones y reservas</p>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="cursor-pointer hover:border-yellow-400 transition-colors" onClick={() => setStatusFilter('pending')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Pendientes</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {getStatusBadge('pending').count}
                </p>
              </div>
              <Badge variant="warning">Requiere acción</Badge>
            </div>
          </Card>

          <Card className="cursor-pointer hover:border-green-400 transition-colors" onClick={() => setStatusFilter('confirmed')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Confirmadas</p>
                <p className="text-3xl font-bold text-green-600">
                  {getStatusBadge('confirmed').count}
                </p>
              </div>
              <Badge variant="success">Activas</Badge>
            </div>
          </Card>

          <Card className="cursor-pointer hover:border-blue-400 transition-colors" onClick={() => setStatusFilter('completed')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Completadas</p>
                <p className="text-3xl font-bold text-blue-600">
                  {getStatusBadge('completed').count}
                </p>
              </div>
              <Badge variant="info">Histórico</Badge>
            </div>
          </Card>

          <Card className="cursor-pointer hover:border-red-400 transition-colors" onClick={() => setStatusFilter('cancelled')}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm mb-1">Canceladas</p>
                <p className="text-3xl font-bold text-red-600">
                  {getStatusBadge('cancelled').count}
                </p>
              </div>
              <Badge variant="danger">Archivadas</Badge>
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
                  placeholder="Buscar por cliente o especialidad..."
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
                <option value="all">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmadas</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {filteredSessions.length} {filteredSessions.length === 1 ? 'sesión encontrada' : 'sesiones encontradas'}
          </p>
        </div>

        {/* Sessions List */}
        <div className="space-y-4">
          {filteredSessions.length === 0 ? (
            <Card>
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-lg text-muted-foreground mb-2">No se encontraron sesiones</p>
                <p className="text-sm text-muted-foreground">
                  Intenta cambiar los filtros o el término de búsqueda
                </p>
              </div>
            </Card>
          ) : (
            filteredSessions.map(session => (
              <Card key={session.id} className="hover:border-primary transition-colors">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Session Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-semibold text-lg">{session.clientName}</h3>
                          <Badge variant={getStatusBadge(session.status).variant}>
                            {getStatusBadge(session.status).label}
                          </Badge>
                        </div>
                        <p className="text-primary">{session.specialty}</p>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>
                          {new Date(session.date).toLocaleDateString('es-ES', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>{session.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <DollarSign className="w-4 h-4" />
                        <span>${session.price}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 lg:flex-col lg:w-48">
                    {session.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          className="flex-1 lg:w-full"
                          onClick={() => handleConfirm(session.id)}
                        >
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          Confirmar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:w-full"
                          onClick={() => handleReschedule(session.id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reprogramar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 lg:w-full"
                          onClick={() => handleCancel(session.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {session.status === 'confirmed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:w-full"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:w-full"
                          onClick={() => handleReschedule(session.id)}
                        >
                          <RotateCcw className="w-4 h-4 mr-1" />
                          Reprogramar
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="flex-1 lg:w-full"
                          onClick={() => handleCancel(session.id)}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Cancelar
                        </Button>
                      </>
                    )}

                    {session.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:w-full"
                        >
                          Ver Detalles
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 lg:w-full"
                        >
                          <User className="w-4 h-4 mr-1" />
                          Ver Cliente
                        </Button>
                      </>
                    )}

                    {session.status === 'cancelled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                      >
                        Ver Detalles
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Calendar as CalendarIcon, Loader2, Clock, ShieldAlert, CheckCircle2, Settings } from 'lucide-react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { agendaService, Slot, Availability, Block } from '../../services/agenda';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lock } from 'lucide-react';

const MINUTES_BEFORE_LOCK = 15;

export default function TherapistSchedule() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('agenda');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Form states for adding blocks/availability
  const [isAddingBlock, setIsAddingBlock] = useState(false);
  const [newBlock, setNewBlock] = useState({
    start_datetime: '',
    end_datetime: '',
    reason: ''
  });

  const [editingAvail, setEditingAvail] = useState<{ day: number; start: string; end: string } | null>(null);

  const fetchAgendaData = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [slotsData, availData, blocksData] = await Promise.all([
        agendaService.getSlots(user.id, selectedDate),
        agendaService.getAvailability(user.id),
        agendaService.getBlocks(user.id)
      ]);
      setSlots(slotsData);
      setAvailabilities(availData);
      setBlocks(blocksData);
    } catch (error) {
      console.error('Error fetching agenda data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, selectedDate]);

  useEffect(() => {
    fetchAgendaData();
  }, [fetchAgendaData]);

  const handleSetAvailability = async (newAvail: Availability[]) => {
    try {
      await agendaService.setAvailability(newAvail);
      fetchAgendaData();
      alert('Disponibilidad actualizada');
    } catch (error) {
      alert('Error updating availability');
    }
  };

  const handleCreateBlock = async (blockData: Block) => {
    try {
      await agendaService.createBlock(blockData);
      setIsAddingBlock(false);
      setNewBlock({ start_datetime: '', end_datetime: '', reason: '' });
      fetchAgendaData();
      alert('Bloqueo creado');
    } catch (error) {
      alert('Error creating block');
    }
  };

  const handleSaveDayAvailability = async () => {
    if (!editingAvail) return;

    // Create new list: replace or add the edited day
    const otherDays = availabilities.filter(a => a.day !== editingAvail.day);
    const updatedList = [...otherDays, editingAvail].sort((a, b) => a.day - b.day);

    try {
      await agendaService.setAvailability(updatedList);
      setEditingAvail(null);
      fetchAgendaData();
      alert('Disponibilidad actualizada');
    } catch (error) {
      alert('Error al guardar disponibilidad');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!blockId) return;
    if (!confirm('¿Estás seguro de eliminar este bloqueo?')) return;

    try {
      await agendaService.deleteBlock(blockId);
      fetchAgendaData();
      alert('Bloqueo eliminado');
    } catch (error) {
      alert('Error al eliminar bloqueo');
    }
  };

  const handleBlockSlot = async (slot: Slot) => {
    if (!confirm(`¿Bloquear el horario ${slot.start}?`)) return;
    try {
      await agendaService.createBlock({
        start_datetime: slot.start_datetime,
        end_datetime: slot.end_datetime,
        reason: 'Bloqueo manual'
      });
      fetchAgendaData();
    } catch (error) {
      alert('Error al bloquear slot');
    }
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-6">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">Panel de Agenda</h1>
          <p className="text-muted-foreground text-lg">Gestiona tus horarios y sesiones con facilidad.</p>
        </header>

        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-12">
            <div className="bg-card rounded-3xl border shadow-sm overflow-hidden p-1">
              <div className="flex bg-muted/50 p-1 rounded-2xl mb-4">
                {['agenda', 'availability', 'blocks'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${activeTab === tab ? 'bg-white shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    {tab === 'agenda' && <span className="flex items-center justify-center gap-2"><CalendarIcon className="w-4 h-4" /> Agenda</span>}
                    {tab === 'availability' && <span className="flex items-center justify-center gap-2"><Clock className="w-4 h-4" /> Mi Horario</span>}
                    {tab === 'blocks' && <span className="flex items-center justify-center gap-2"><ShieldAlert className="w-4 h-4" /> Bloqueos</span>}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === 'agenda' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2"><CalendarIcon className="w-5 h-5 text-primary" /> Vista de Slots</h2>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="p-2 border rounded-xl bg-background"
                      />
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-primary" /></div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {slots.length > 0 ? slots.map((slot, idx) => {
                          const slotDate = new Date(slot.start_datetime);
                          const now = new Date();
                          const isExpired = slotDate.getTime() - (MINUTES_BEFORE_LOCK * 60000) < now.getTime();

                          return (
                            <div key={idx} className={`p-4 border rounded-2xl flex flex-col items-center transition-all relative group ${isExpired
                              ? 'bg-muted/50 border-border opacity-70 cursor-not-allowed'
                              : 'bg-primary/5 border-primary/10 hover:bg-primary/10 cursor-default'
                              }`}>

                              {!isExpired && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleBlockSlot(slot);
                                  }}
                                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-white border shadow-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-600 hover:border-red-100"
                                  title="Bloquear Slot"
                                >
                                  <Lock className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <div className={`text-lg font-bold ${isExpired ? 'text-muted-foreground' : 'text-primary'}`}>
                                {slot.start}
                              </div>
                              <div className="text-xs text-muted-foreground">Sesión 45m</div>

                              {isExpired ? (
                                <Badge variant="default" className="mt-2 text-[10px] bg-muted-foreground/10 text-muted-foreground">Expirado</Badge>
                              ) : (
                                <Badge variant="default" className="mt-2 text-[10px] bg-white text-primary">Disponible</Badge>
                              )}
                            </div>
                          );
                        }) : (
                          <div className="col-span-full py-20 text-center bg-muted/20 rounded-3xl border border-dashed border-border leading-relaxed">
                            <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <p className="text-muted-foreground text-lg">No hay slots disponibles para {selectedDate}.</p>
                            <p className="text-sm text-muted-foreground mt-1">Configura tu horario semanal o elimina bloqueos.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'availability' && (
                  <div className="space-y-6">
                    <h2 className="text-xl font-bold flex items-center gap-2"><Clock className="w-5 h-5 text-primary" /> Configurar Horario Semanal</h2>

                    {editingAvail && (
                      <Card className="p-6 border-primary bg-primary/5">
                        <h3 className="font-bold mb-4 text-primary">Editando: {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'][editingAvail.day]}</h3>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <Label>Hora Inicio</Label>
                            <Input type="time" value={editingAvail.start} onChange={e => setEditingAvail({ ...editingAvail, start: e.target.value })} />
                          </div>
                          <div className="space-y-2">
                            <Label>Hora Fin</Label>
                            <Input type="time" value={editingAvail.end} onChange={e => setEditingAvail({ ...editingAvail, end: e.target.value })} />
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="ghost" onClick={() => setEditingAvail(null)}>Cancelar</Button>
                          <Button onClick={handleSaveDayAvailability}>Guardar</Button>
                        </div>
                      </Card>
                    )}

                    <div className="grid gap-4">
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map((day, idx) => {
                        const avail = availabilities.find(a => a.day === idx);
                        return (
                          <div key={idx} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/10 hover:bg-muted/20 transition-all">
                            <span className="font-semibold text-lg">{day}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-muted-foreground">{avail ? `${avail.start.substring(0, 5)} - ${avail.end.substring(0, 5)}` : 'Sin horario set'}</span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl"
                                onClick={() => setEditingAvail({
                                  day: idx,
                                  start: avail?.start.substring(0, 5) || '09:00',
                                  end: avail?.end.substring(0, 5) || '17:00'
                                })}
                              >
                                Editar
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'blocks' && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-bold flex items-center gap-2"><ShieldAlert className="w-5 h-5 text-primary" /> Bloqueos Activos</h2>
                      <Button className="rounded-xl" onClick={() => setIsAddingBlock(true)}><Plus className="w-4 h-4 mr-2" /> Nuevo Bloqueo</Button>
                    </div>

                    {isAddingBlock && (
                      <Card className="p-4 border-primary/20 bg-primary/5">
                        <div className="grid gap-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Inicio</Label>
                              <Input type="datetime-local" value={newBlock.start_datetime} onChange={(e) => setNewBlock({ ...newBlock, start_datetime: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                              <Label>Fin</Label>
                              <Input type="datetime-local" value={newBlock.end_datetime} onChange={(e) => setNewBlock({ ...newBlock, end_datetime: e.target.value })} />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Motivo</Label>
                            <Input placeholder="Ej: Vacaciones, Reunión..." value={newBlock.reason} onChange={(e) => setNewBlock({ ...newBlock, reason: e.target.value })} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setIsAddingBlock(false)}>Cancelar</Button>
                            <Button onClick={() => handleCreateBlock(newBlock)}>Guardar Bloqueo</Button>
                          </div>
                        </div>
                      </Card>
                    )}

                    <div className="grid gap-4">
                      {blocks.length > 0 ? blocks.map((block, idx) => (
                        <div key={idx} className="flex items-center justify-between p-4 border border-red-100 bg-red-50/30 rounded-2xl">
                          <div>
                            <p className="font-bold text-red-900">{block.reason || 'Bloqueo sin motivo'}</p>
                            <p className="text-sm text-red-700/80">
                              Desde: {new Date(block.start_datetime).toLocaleString()}
                              <br />
                              Hasta: {new Date(block.end_datetime).toLocaleString()}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-red-600 hover:bg-red-50 rounded-xl"
                            size="sm"
                            onClick={() => block.internal_id && handleDeleteBlock(block.internal_id)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      )) : (
                        <p className="text-center py-10 text-muted-foreground italic">No tienes bloqueos configurados.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

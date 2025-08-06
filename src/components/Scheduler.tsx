// src/components/Scheduler.tsx
import { useEffect, useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { supabase } from '../lib/supabaseClient';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { CalendarDays, Clock, MapPin, User } from 'lucide-react';
import { toast } from 'sonner';

type Paciente = { id: string; nome_completo: string; };
type Sala = { id: string; nome_sala: string; };
type Agendamento = {
  id: string;
  title: string;
  start: string;
  end: string;
  extendedProps: {
    paciente_id: string;
    sala_id: string;
  }
}

export function Scheduler() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [salas, setSalas] = useState<Sala[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPacienteId, setSelectedPacienteId] = useState('');
  const [selectedSalaId, setSelectedSalaId] = useState('');

  async function fetchAgendamentos() {
    const { data, error } = await supabase.from('agendamentos_view').select('*');
    if (data) {
      const eventosFormatados = data.map(ag => ({
        id: ag.id,
        title: `${ag.nome_paciente} - ${ag.nome_sala}`,
        start: ag.data_inicio,
        end: ag.data_fim,
        extendedProps: {
            paciente_id: ag.paciente_id,
            sala_id: ag.sala_id,
        }
      }));
      setAgendamentos(eventosFormatados);
    }
    if (error) console.error("Erro ao buscar agendamentos", error);
  }

  async function fetchPacientesESalas() {
    const { data: pacientesData, error: pacientesError } = await supabase.from('pacientes').select('id, nome_completo');
    const { data: salasData, error: salasError } = await supabase.from('salas').select('id, nome_sala');

    if (pacientesData) setPacientes(pacientesData);
    if (pacientesError) console.error("Erro ao buscar pacientes", pacientesError);
    if (salasData) setSalas(salasData);
    if (salasError) console.error("Erro ao buscar salas", salasError);
  }

  useEffect(() => {
    fetchAgendamentos();
    fetchPacientesESalas();
  }, []);

  function handleDateClick(arg: any) {
    setSelectedDate(arg.date);
    setIsDialogOpen(true);
  }

  async function handleSaveAgendamento() {
    if (!selectedPacienteId || !selectedSalaId || !selectedDate) {
        return toast.error("Por favor, selecione um paciente e uma sala.");
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado.");

    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single();
    if (!perfil || !perfil.clinica_id) return toast.error("Usuário sem clínica associada.");

    const { error } = await supabase.from('agendamentos').insert({
        paciente_id: selectedPacienteId,
        sala_id: selectedSalaId,
        medico_id: user.id,
        data_inicio: selectedDate.toISOString(),
        data_fim: new Date(selectedDate.getTime() + 60 * 60 * 1000).toISOString(),
        clinica_id: perfil.clinica_id,
    });

    if (error) {
        toast.error("Erro ao salvar agendamento: " + error.message);
    } else {
        toast.success("Agendamento salvo com sucesso!");
        setIsDialogOpen(false);
        setSelectedPacienteId('');
        setSelectedSalaId('');
        fetchAgendamentos();
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Agenda
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie seus agendamentos e consultas
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4" />
          {agendamentos.length} agendamentos
        </Badge>
      </div>

      {/* Calendar Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Calendário de Agendamentos
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="calendar-container">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="timeGridWeek"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={agendamentos}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              locale="pt-br"
              buttonText={{
                  today: 'Hoje',
                  month: 'Mês',
                  week: 'Semana',
                  day: 'Dia',
              }}
              height="auto"
              eventClassNames="bg-gradient-to-r from-primary to-blue-600 border-0 rounded-lg shadow-sm"
            />
          </div>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-primary" />
              Novo Agendamento
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Paciente
              </Label>
              <select 
                value={selectedPacienteId} 
                onChange={(e) => setSelectedPacienteId(e.target.value)} 
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Selecione um paciente</option>
                {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Sala
              </Label>
              <select 
                value={selectedSalaId} 
                onChange={(e) => setSelectedSalaId(e.target.value)} 
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="">Selecione uma sala</option>
                {salas.map(s => <option key={s.id} value={s.id}>{s.nome_sala}</option>)}
              </select>
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Data e Hora
              </Label>
              <Input 
                type="text" 
                value={selectedDate?.toLocaleString('pt-BR') || ''} 
                readOnly 
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveAgendamento} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
              Salvar Agendamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

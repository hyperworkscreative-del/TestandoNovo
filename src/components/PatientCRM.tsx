// src/components/PatientCRM.tsx
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Textarea } from "./ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { toast } from "sonner"
import { Skeleton } from "./ui/skeleton"
import { PlusCircle, Trash2, Edit, Phone, Mail, User, MessageSquare, Calendar } from 'lucide-react'

type Paciente = { id: string; nome_completo: string; telefone: string | null; email: string | null; status: string | null; notas: string | null; cpf: string | null; };
type Interacao = { id: string; tipo_interacao: string; resumo: string; created_at: string; };

export function PatientCRM() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);
  const [interacoes, setInteracoes] = useState<Interacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [novoPaciente, setNovoPaciente] = useState({ nome_completo: '', cpf: '', telefone: '', email: '' });
  const [novaInteracao, setNovaInteracao] = useState({ tipo: 'Ligação', resumo: '' });

  async function fetchPacientes() {
    setLoading(true);
    const { data, error } = await supabase.from('pacientes').select('*').order('nome_completo');
    if (error) toast.error("Erro ao carregar pacientes.");
    else setPacientes(data || []);
    setLoading(false);
  }

  useEffect(() => { fetchPacientes(); }, []);

  async function handleSelectPaciente(paciente: Paciente) {
    setSelectedPaciente(paciente);
    const { data, error } = await supabase.from('interacoes_crm').select('*').eq('paciente_id', paciente.id).order('created_at', { ascending: false });
    if (error) toast.error("Erro ao carregar interações.");
    else setInteracoes(data || []);
  }

  async function handleAddPaciente() {
    if (!novoPaciente.nome_completo.trim()) return toast.error('O nome do paciente é obrigatório.');
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado");
    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single();
    if (!perfil || !perfil.clinica_id) return toast.error("Usuário sem clínica associada.");

    const { error } = await supabase.from('pacientes').insert({ 
        nome_completo: novoPaciente.nome_completo, 
        cpf: novoPaciente.cpf || null, 
        telefone: novoPaciente.telefone || null, 
        email: novoPaciente.email || null,
        clinica_id: perfil.clinica_id
    });

    if (error) { toast.error('Erro ao adicionar paciente: ' + error.message); } 
    else {
      toast.success("Paciente adicionado com sucesso!");
      setNovoPaciente({ nome_completo: '', cpf: '', telefone: '', email: '' });
      setIsAddDialogOpen(false);
      await fetchPacientes();
    }
  }

  async function handleDeletePaciente() {
    if (!selectedPaciente) return toast.error("Nenhum paciente selecionado.");
    if (window.confirm(`Tem certeza que deseja deletar o paciente ${selectedPaciente.nome_completo}?`)) {
      const { error } = await supabase.from('pacientes').delete().eq('id', selectedPaciente.id);
      if (error) { toast.error("Erro ao deletar paciente: " + error.message); }
      else {
        toast.success("Paciente deletado com sucesso!");
        setSelectedPaciente(null);
        setInteracoes([]);
        await fetchPacientes();
      }
    }
  }

  async function handleAddInteracao() {
    if (!selectedPaciente || !novaInteracao.resumo.trim()) return toast.error("Selecione um paciente e adicione um resumo.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return toast.error("Usuário não autenticado.");
    const { error } = await supabase.from('interacoes_crm').insert({
      paciente_id: selectedPaciente.id,
      tipo_interacao: novaInteracao.tipo,
      resumo: novaInteracao.resumo,
      responsavel_id: user.id
    });
    if (error) toast.error("Erro ao salvar interação: " + error.message);
    else {
      toast.success("Interação registrada!");
      setNovaInteracao({ tipo: 'Ligação', resumo: '' });
      handleSelectPaciente(selectedPaciente);
    }
  }

  const filteredPacientes = pacientes.filter(p => 
    p.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.telefone?.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            CRM de Pacientes
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie relacionamentos e histórico de pacientes
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          {pacientes.length} pacientes
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1 flex flex-col border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Pacientes
              </CardTitle>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Adicionar
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Adicionar Novo Paciente</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="nome_completo">Nome Completo</Label>
                      <Input 
                        id="nome_completo" 
                        value={novoPaciente.nome_completo} 
                        onChange={e => setNovoPaciente({...novoPaciente, nome_completo: e.target.value})} 
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input 
                        id="cpf" 
                        value={novoPaciente.cpf} 
                        onChange={e => setNovoPaciente({...novoPaciente, cpf: e.target.value})} 
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telefone">Telefone</Label>
                      <Input 
                        id="telefone" 
                        value={novoPaciente.telefone} 
                        onChange={e => setNovoPaciente({...novoPaciente, telefone: e.target.value})} 
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={novoPaciente.email} 
                        onChange={e => setNovoPaciente({...novoPaciente, email: e.target.value})} 
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleAddPaciente} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      Salvar Paciente
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="pt-4">
              <Input
                placeholder="Buscar pacientes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="focus:ring-2 focus:ring-primary"
              />
            </div>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-0">
            <div className="space-y-1 p-4">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
              ) : (
                filteredPacientes.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => handleSelectPaciente(p)}
                    className={`
                      flex items-center space-x-3 p-3 rounded-lg cursor-pointer transition-all duration-200
                      hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:scale-[1.02]
                      ${selectedPaciente?.id === p.id 
                        ? 'bg-gradient-to-r from-primary/10 to-blue-600/10 border border-primary/20 shadow-sm' 
                        : 'hover:shadow-sm'
                      }
                    `}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                        {p.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.nome_completo}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        {p.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {p.telefone}
                          </span>
                        )}
                        {p.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {p.email.slice(0, 20)}...
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detalhes do Paciente */}
        <Card className="lg:col-span-2 border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
          {selectedPaciente ? (
            <>
              <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-lg">
                        {selectedPaciente.nome_completo.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-xl">{selectedPaciente.nome_completo}</CardTitle>
                      <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 dark:text-slate-400">
                        {selectedPaciente.telefone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            {selectedPaciente.telefone}
                          </span>
                        )}
                        {selectedPaciente.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            {selectedPaciente.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" disabled>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeletePaciente}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {/* Nova Interação */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Registrar Nova Interação
                  </h4>
                  <div className="space-y-3">
                    <select 
                      value={novaInteracao.tipo} 
                      onChange={e => setNovaInteracao({...novaInteracao, tipo: e.target.value})} 
                      className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option>Ligação</option>
                      <option>Email</option>
                      <option>WhatsApp</option>
                      <option>Consulta</option>
                      <option>Outro</option>
                    </select>
                    <Textarea 
                      placeholder="Descreva a interação..." 
                      value={novaInteracao.resumo} 
                      onChange={e => setNovaInteracao({...novaInteracao, resumo: e.target.value})} 
                      className="focus:ring-2 focus:ring-primary"
                    />
                    <Button onClick={handleAddInteracao} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Salvar Interação
                    </Button>
                  </div>
                </div>

                {/* Histórico */}
                <div>
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-primary" />
                    Histórico de Interações
                  </h4>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {interacoes.length > 0 ? interacoes.map(i => (
                      <div key={i.id} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {i.tipo_interacao}
                          </Badge>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(i.created_at).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300">{i.resumo}</p>
                      </div>
                    )) : (
                      <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                        <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Nenhuma interação registrada ainda</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <User className="h-16 w-16 mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <p className="text-slate-500 dark:text-slate-400 text-lg">
                  Selecione um paciente para ver os detalhes
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

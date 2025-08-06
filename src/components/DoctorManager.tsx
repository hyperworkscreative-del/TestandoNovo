// src/components/DoctorManager.tsx
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Avatar, AvatarFallback } from "./ui/avatar"
import { Edit, UserPlus, Trash2, Stethoscope, DollarSign, FileText, Users } from 'lucide-react'
import { toast } from "sonner"
import { Skeleton } from "./ui/skeleton"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"

type Medico = { id: string; nome_completo: string | null; tipo_contrato: 'aluguel' | 'parceria' | null; valor_contrato: number | null; };

export function DoctorManager() {
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [loading, setLoading] = useState(true);
  const [isContratoDialogOpen, setIsContratoDialogOpen] = useState(false);
  const [currentMedico, setCurrentMedico] = useState<Medico | null>(null);
  const [tipoContrato, setTipoContrato] = useState<'aluguel' | 'parceria'>('aluguel');
  const [valorContrato, setValorContrato] = useState('');
  const [isNovoMedicoDialogOpen, setIsNovoMedicoDialogOpen] = useState(false);
  const [novoMedico, setNovoMedico] = useState({ email: '', password: '', nome_completo: '' });

  async function fetchMedicos() { 
    setLoading(true); 
    await new Promise(resolve => setTimeout(resolve, 500)); 
    const { data, error } = await supabase.from('medicos_view').select('*'); 
    if (error) { 
      toast.error('Não foi possível carregar os médicos.'); 
    } else if (data) { 
      setMedicos(data); 
    } 
    setLoading(false); 
  }

  useEffect(() => { fetchMedicos(); }, []);

  function handleOpenContratoDialog(medico: Medico) { 
    setCurrentMedico(medico); 
    setTipoContrato(medico.tipo_contrato || 'aluguel'); 
    setValorContrato(medico.valor_contrato?.toString() || ''); 
    setIsContratoDialogOpen(true); 
  }

  async function handleSaveContrato() { 
    if (!currentMedico || !valorContrato) return toast.error('Todos os campos são obrigatórios.'); 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return toast.error("Usuário não autenticado"); 
    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single(); 
    if (!perfil || !perfil.clinica_id) return toast.error("Admin sem clínica associada."); 
    const { error } = await supabase.from('contratos_medicos').upsert({ 
      medico_id: currentMedico.id, 
      tipo_contrato: tipoContrato, 
      valor: parseFloat(valorContrato), 
      clinica_id: perfil.clinica_id 
    }, { onConflict: 'medico_id, clinica_id' }); 
    if (error) { 
      toast.error('Erro ao salvar contrato: ' + error.message); 
    } else { 
      toast.success("Contrato salvo com sucesso!"); 
      setIsContratoDialogOpen(false); 
      await fetchMedicos(); 
    } 
  }

  async function handleAddNovoMedico() { 
    const { email, password, nome_completo } = novoMedico; 
    if (!email || !password || !nome_completo) return toast.error("Todos os campos são obrigatórios."); 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return toast.error("Usuário não autenticado"); 
    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single(); 
    if (!perfil || !perfil.clinica_id) return toast.error("Admin sem clínica associada."); 
    const { error } = await supabase.functions.invoke('create-user', { 
      body: { 
        email, 
        password, 
        nome_completo, 
        funcao: 'medico', 
        clinica_id: perfil.clinica_id 
      } 
    }); 
    if (error) { 
      toast.error("Falha ao criar usuário: " + error.message); 
    } else { 
      toast.success("Médico criado com sucesso!"); 
      setIsNovoMedicoDialogOpen(false); 
      setNovoMedico({ email: '', password: '', nome_completo: '' }); 
      await fetchMedicos(); 
    } 
  }

  async function handleDeleteMedico(medico: Medico) { 
    if (window.confirm(`Tem certeza que deseja deletar o usuário ${medico.nome_completo}? Esta ação é irreversível e apagará todos os seus dados.`)) { 
      const { error } = await supabase.functions.invoke('delete-user', { 
        body: { user_id: medico.id } 
      }); 
      if (error) { 
        toast.error("Falha ao deletar usuário: " + error.message); 
      } else { 
        toast.success("Médico deletado com sucesso!"); 
        await fetchMedicos(); 
      } 
    } 
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Gerenciador de Médicos
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Gerencie médicos e seus contratos
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Users className="h-4 w-4" />
          {medicos.length} médicos
        </Badge>
      </div>

      {/* Main Card */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardHeader className="border-b border-slate-200/60 dark:border-slate-700/60">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Médicos Cadastrados
            </CardTitle>
            <Dialog open={isNovoMedicoDialogOpen} onOpenChange={setIsNovoMedicoDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  <UserPlus className="mr-2 h-4 w-4"/>
                  Adicionar Médico
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Adicionar Novo Médico
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Nome Completo</Label>
                    <Input 
                      value={novoMedico.nome_completo} 
                      onChange={e => setNovoMedico({ ...novoMedico, nome_completo: e.target.value })} 
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input 
                      type="email" 
                      value={novoMedico.email} 
                      onChange={e => setNovoMedico({ ...novoMedico, email: e.target.value })} 
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha Provisória</Label>
                    <Input 
                      type="password" 
                      value={novoMedico.password} 
                      onChange={e => setNovoMedico({ ...novoMedico, password: e.target.value })} 
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddNovoMedico} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                    Criar Usuário
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-200/60 dark:border-slate-700/60">
                  <TableHead className="font-semibold">Médico</TableHead>
                  <TableHead className="font-semibold">Tipo de Contrato</TableHead>
                  <TableHead className="font-semibold">Valor</TableHead>
                  <TableHead className="text-right font-semibold">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? ( 
                  Array.from({ length: 3 }).map((_, index) => (
                    <TableRow key={index} className="border-slate-200/60 dark:border-slate-700/60">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                      <TableCell className="text-right"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : medicos.length > 0 ? ( 
                  medicos.map((medico) => (
                    <TableRow key={medico.id} className="border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white">
                              {medico.nome_completo?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'M'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{medico.nome_completo || 'N/A'}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Médico</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {medico.tipo_contrato ? (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <FileText className="h-3 w-3" />
                            {medico.tipo_contrato === 'aluguel' ? 'Aluguel' : 'Parceria'}
                          </Badge>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">Não definido</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {medico.valor_contrato ? (
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 font-medium">
                            <DollarSign className="h-4 w-4" />
                            R$ {medico.valor_contrato.toFixed(2)}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 italic">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenContratoDialog(medico)}
                            className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20" 
                            onClick={() => handleDeleteMedico(medico)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )) 
                ) : ( 
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <Stethoscope className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-100">Nenhum médico encontrado</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Adicione o primeiro médico para começar</p>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow> 
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Contract Dialog */}
      <Dialog open={isContratoDialogOpen} onOpenChange={setIsContratoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Definir Contrato
            </DialogTitle>
            <DialogDescription>
              Defina os detalhes do contrato para {currentMedico?.nome_completo}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Contrato</Label>
              <select 
                id="tipo" 
                value={tipoContrato} 
                onChange={(e) => setTipoContrato(e.target.value as 'aluguel' | 'parceria')} 
                className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              >
                <option value="aluguel">Aluguel por Hora</option>
                <option value="parceria">Parceria (%)</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">
                {tipoContrato === 'aluguel' ? 'Valor por Hora (R$)' : 'Percentual para a Clínica (%)'}
              </Label>
              <Input 
                id="valor" 
                type="number" 
                value={valorContrato} 
                onChange={(e) => setValorContrato(e.target.value)} 
                placeholder={tipoContrato === 'aluguel' ? 'Ex: 150.00' : 'Ex: 30'} 
                className="focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveContrato} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
              Salvar Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

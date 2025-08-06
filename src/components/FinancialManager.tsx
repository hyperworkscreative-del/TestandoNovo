// src/components/FinancialManager.tsx
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { CircleDollarSign, FileText, TrendingUp, Calendar, Download, Plus, DollarSign } from 'lucide-react'
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { toast } from "sonner"

type Despesa = { id: string; descricao: string; valor: number; data_despesa: string; };
type Relatorio = { medico_id: string; nome_medico: string; total_horas_sala: number; custo_aluguel_sala: number; receita_parceria: number; custo_consumo_produtos: number; custo_condominio: number; valor_final_fatura: number; };

export function FinancialManager() {
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [loadingDespesas, setLoadingDespesas] = useState(true);
  const [loadingRelatorio, setLoadingRelatorio] = useState(false);
  const [novaDespesa, setNovaDespesa] = useState({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0] });
  const [relatorio, setRelatorio] = useState<Relatorio[]>([]);
  const [mesAno, setMesAno] = useState({ mes: new Date().getMonth() + 1, ano: new Date().getFullYear() });

  function exportarPdf() {
    const doc = new jsPDF();
    doc.text(`Relatório de Fechamento - ${mesAno.mes}/${mesAno.ano}`, 14, 16);
    const head = [['Médico', 'Aluguel', 'Parceria', 'Produtos', 'Condomínio', 'FATURA FINAL']];
    const body = relatorio.map(r => [ 
      r.nome_medico, 
      `R$ ${r.custo_aluguel_sala.toFixed(2)}`, 
      `R$ ${r.receita_parceria.toFixed(2)}`, 
      `R$ ${r.custo_consumo_produtos.toFixed(2)}`, 
      `R$ ${r.custo_condominio.toFixed(2)}`, 
      `R$ ${r.valor_final_fatura.toFixed(2)}`, 
    ]);
    autoTable(doc, { head, body, startY: 25 });
    doc.save(`fechamento-${mesAno.mes}-${mesAno.ano}.pdf`);
  }

  async function fetchDespesas() {
    setLoadingDespesas(true);
    const { data } = await supabase.from('despesas_clinica').select('*').order('data_despesa', { ascending: false });
    setDespesas(data || []);
    setLoadingDespesas(false);
  }

  useEffect(() => { fetchDespesas(); }, []);

  async function handleAddDespesa() { 
    if (!novaDespesa.descricao || !novaDespesa.valor) return toast.error('Descrição e Valor são obrigatórios.'); 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return toast.error("Usuário não autenticado"); 
    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single(); 
    if (!perfil || !perfil.clinica_id) return toast.error("Usuário sem clínica associada."); 
    const { error } = await supabase.from('despesas_clinica').insert({ 
      descricao: novaDespesa.descricao, 
      valor: parseFloat(novaDespesa.valor), 
      data_despesa: novaDespesa.data, 
      clinica_id: perfil.clinica_id 
    }); 
    if (error) { 
      toast.error(error.message); 
    } else { 
      toast.success("Despesa lançada com sucesso!"); 
      setNovaDespesa({ descricao: '', valor: '', data: new Date().toISOString().split('T')[0] }); 
      fetchDespesas(); 
    } 
  }
  
  async function handleGerarRelatorio() {
    setLoadingRelatorio(true);
    const { data, error } = await supabase.rpc('gerar_fechamento_mensal', { mes: mesAno.mes, ano: mesAno.ano });
    if (error) { 
      toast.error("Erro ao gerar relatório: " + error.message); 
    } else {
      setRelatorio(data);
      if (data && data.length > 0) { 
        toast.success("Relatório gerado com sucesso!"); 
      } else { 
        toast.info("Nenhum dado encontrado para este período."); 
      }
    }
    setLoadingRelatorio(false);
  }

  const totalDespesas = despesas.reduce((acc, d) => acc + d.valor, 0);
  const totalFaturamento = relatorio.reduce((acc, r) => acc + r.valor_final_fatura, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Gestão Financeira
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Controle despesas, fechamentos e relatórios financeiros
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {despesas.length} despesas
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            R$ {totalDespesas.toFixed(2)}
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Faturamento Total</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">R$ {totalFaturamento.toFixed(2)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600 dark:text-red-400">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-900 dark:text-red-100">R$ {totalDespesas.toFixed(2)}</p>
              </div>
              <CircleDollarSign className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Saldo Líquido</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">R$ {(totalFaturamento - totalDespesas).toFixed(2)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardContent className="p-6">
          <Tabs defaultValue="fechamento">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="fechamento" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Fechamento Mensal
              </TabsTrigger>
              <TabsTrigger value="despesas" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Lançar Despesas
              </TabsTrigger>
            </TabsList>

            <TabsContent value="fechamento" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Gerar Relatório de Fechamento
                </h3>
                {relatorio.length > 0 && (
                  <Button onClick={exportarPdf} variant="outline" className="flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </Button>
                )}
              </div>
              
              <div className="flex items-end space-x-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Mês
                  </Label>
                  <Input 
                    type="number" 
                    min="1" 
                    max="12" 
                    value={mesAno.mes} 
                    onChange={e => setMesAno({ ...mesAno, mes: parseInt(e.target.value) })} 
                    className="w-20 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ano</Label>
                  <Input 
                    type="number" 
                    value={mesAno.ano} 
                    onChange={e => setMesAno({ ...mesAno, ano: parseInt(e.target.value) })} 
                    className="w-24 focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button 
                  onClick={handleGerarRelatorio} 
                  disabled={loadingRelatorio}
                  className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90"
                >
                  {loadingRelatorio ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Gerando...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Gerar Relatório
                    </div>
                  )}
                </Button>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 dark:border-slate-700/60">
                      <TableHead className="font-semibold">Médico</TableHead>
                      <TableHead className="font-semibold">Aluguel</TableHead>
                      <TableHead className="font-semibold">Parceria</TableHead>
                      <TableHead className="font-semibold">Produtos</TableHead>
                      <TableHead className="font-semibold">Condomínio</TableHead>
                      <TableHead className="font-semibold">FATURA FINAL</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingRelatorio ? (
                      Array.from({length: 2}).map((_, i) => (
                        <TableRow key={i} className="border-slate-200/60 dark:border-slate-700/60">
                          <TableCell><Skeleton className="h-4 w-32"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                        </TableRow>
                      ))
                    ) : relatorio.length > 0 ? (
                      relatorio.map(r => (
                        <TableRow key={r.medico_id} className="border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium">{r.nome_medico}</TableCell>
                          <TableCell className="text-blue-600 dark:text-blue-400 font-medium">R$ {r.custo_aluguel_sala.toFixed(2)}</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">R$ {r.receita_parceria.toFixed(2)}</TableCell>
                          <TableCell className="text-orange-600 dark:text-orange-400 font-medium">R$ {r.custo_consumo_produtos.toFixed(2)}</TableCell>
                          <TableCell className="text-purple-600 dark:text-purple-400 font-medium">R$ {r.custo_condominio.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="font-bold">
                              R$ {r.valor_final_fatura.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <FileText className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">Nenhum relatório gerado</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Selecione um período e clique em "Gerar Relatório"</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="despesas" className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Lançar Nova Despesa de Condomínio
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                  <div className="space-y-2">
                    <Label>Descrição</Label>
                    <Input 
                      value={novaDespesa.descricao} 
                      onChange={e => setNovaDespesa({ ...novaDespesa, descricao: e.target.value })} 
                      placeholder="Ex: Conta de luz"
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor (R$)</Label>
                    <Input 
                      type="number" 
                      value={novaDespesa.valor} 
                      onChange={e => setNovaDespesa({ ...novaDespesa, valor: e.target.value })} 
                      placeholder="0.00"
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data</Label>
                    <Input 
                      type="date" 
                      value={novaDespesa.data} 
                      onChange={e => setNovaDespesa({ ...novaDespesa, data: e.target.value })} 
                      className="focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleAddDespesa} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      <Plus className="h-4 w-4 mr-2" />
                      Lançar
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 dark:border-slate-700/60">
                      <TableHead className="font-semibold">Data</TableHead>
                      <TableHead className="font-semibold">Descrição</TableHead>
                      <TableHead className="font-semibold">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingDespesas ? (
                      Array.from({length: 3}).map((_, i) => (
                        <TableRow key={i} className="border-slate-200/60 dark:border-slate-700/60">
                          <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-48"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                        </TableRow>
                      ))
                    ) : despesas.length > 0 ? (
                      despesas.map(d => (
                        <TableRow key={d.id} className="border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-slate-400" />
                              {new Date(d.data_despesa).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{d.descricao}</TableCell>
                          <TableCell>
                            <Badge variant="destructive" className="font-medium">
                              R$ {d.valor.toFixed(2)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <CircleDollarSign className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">Nenhuma despesa encontrada</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Adicione a primeira despesa para começar</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

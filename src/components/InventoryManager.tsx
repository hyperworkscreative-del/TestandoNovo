// src/components/InventoryManager.tsx
import { useEffect, useState } from "react"
import { supabase } from "../lib/supabaseClient"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { Skeleton } from "./ui/skeleton"
import { toast } from "sonner"
import { PlusCircle, Package, Activity, BarChart3, Warehouse, User, MapPin, Calendar } from 'lucide-react'

type Produto = { id: string; nome_produto: string; custo_distribuidor: number; estoque_atual: number; };
type Medico = { id: string; nome_completo: string | null; };
type Paciente = { id: string; nome_completo: string; };
type Consumo = { id: string; created_at: string; quantidade: number; custo_total_no_momento: number; produtos: { nome_produto: string; }[] | null; pacientes: { nome_completo: string; }[] | null; };

export function InventoryManager() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [medicos, setMedicos] = useState<Medico[]>([]);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [consumo, setConsumo] = useState<Consumo[]>([]);
  const [loading, setLoading] = useState(true);

  const [isProdutoDialogOpen, setIsProdutoDialogOpen] = useState(false);
  const [novoProduto, setNovoProduto] = useState({ nome: '', custo: '', estoque: '' });
  const [logConsumo, setLogConsumo] = useState({ medicoId: '', pacienteId: '', produtoId: '', quantidade: '' });
  const [filtroRelatorio, setFiltroRelatorio] = useState({ medicoId: '' });
  
  async function fetchData() {
    setLoading(true);
    const { data: produtosData } = await supabase.from('produtos').select('*').order('nome_produto');
    const { data: medicosData } = await supabase.from('perfis').select('id, nome_completo').eq('funcao', 'medico');
    const { data: pacientesData } = await supabase.from('pacientes').select('id, nome_completo');
    
    setProdutos(produtosData || []);
    setMedicos(medicosData || []);
    setPacientes(pacientesData || []);
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  async function handleAddProduto() { 
    if (!novoProduto.nome || !novoProduto.custo) return toast.error('Nome e Custo são obrigatórios.'); 
    const { data: { user } } = await supabase.auth.getUser(); 
    if (!user) return toast.error("Usuário não autenticado"); 
    const { data: perfil } = await supabase.from('perfis').select('clinica_id').eq('id', user.id).single(); 
    if (!perfil || !perfil.clinica_id) return toast.error("Usuário sem clínica associada."); 
    const { error } = await supabase.from('produtos').insert({ 
      nome_produto: novoProduto.nome, 
      custo_distribuidor: parseFloat(novoProduto.custo), 
      estoque_atual: parseInt(novoProduto.estoque, 10) || 0, 
      clinica_id: perfil.clinica_id, 
    }); 
    if (error) toast.error(error.message); 
    else { 
      toast.success("Produto adicionado com sucesso!"); 
      setIsProdutoDialogOpen(false); 
      setNovoProduto({ nome: '', custo: '', estoque: '' }); 
      fetchData(); 
    } 
  }

  async function handleLogConsumo() { 
    const { medicoId, pacienteId, produtoId, quantidade } = logConsumo; 
    if (!medicoId || !produtoId || !quantidade) return toast.error('Médico, Produto e Quantidade são obrigatórios.'); 
    const produtoSelecionado = produtos.find(p => p.id === produtoId); 
    if (!produtoSelecionado) return toast.error('Produto não encontrado.'); 
    const custoTotal = produtoSelecionado.custo_distribuidor * 1.05 * parseInt(quantidade, 10); 
    const { error } = await supabase.from('consumo_produtos').insert({ 
      medico_id: medicoId, 
      paciente_id: pacienteId || null, 
      produto_id: produtoId, 
      quantidade: parseInt(quantidade, 10), 
      custo_total_no_momento: custoTotal, 
    }); 
    if (error) toast.error(error.message); 
    else { 
      toast.success('Consumo registrado com sucesso!'); 
      setLogConsumo({ medicoId: '', pacienteId: '', produtoId: '', quantidade: '' }); 
    } 
  }

  async function fetchConsumo() { 
    if (!filtroRelatorio.medicoId) return; 
    const { data, error } = await supabase.from('consumo_produtos').select('id, created_at, quantidade, custo_total_no_momento, produtos(nome_produto), pacientes(nome_completo)').eq('medico_id', filtroRelatorio.medicoId).order('created_at', { ascending: false }); 
    if (error) toast.error(error.message); 
    else { 
      setConsumo(data as Consumo[]); 
      toast.success("Relatório gerado!"); 
    } 
  }

  const totalEstoque = produtos.reduce((acc, p) => acc + p.estoque_atual, 0);
  const valorTotalEstoque = produtos.reduce((acc, p) => acc + (p.custo_distribuidor * p.estoque_atual), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-slate-900 to-slate-600 dark:from-slate-100 dark:to-slate-400 bg-clip-text text-transparent">
            Gestão de Estoque
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Controle produtos, consumo e relatórios
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            {produtos.length} produtos
          </Badge>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Warehouse className="h-4 w-4" />
            {totalEstoque} itens
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total de Produtos</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{produtos.length}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Itens em Estoque</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{totalEstoque}</p>
              </div>
              <Warehouse className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Valor Total</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">R$ {valorTotalEstoque.toFixed(2)}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm dark:bg-slate-900/80">
        <CardContent className="p-6">
          <Tabs defaultValue="catalogo" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="catalogo" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Catálogo
              </TabsTrigger>
              <TabsTrigger value="registro" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Registrar Uso
              </TabsTrigger>
              <TabsTrigger value="relatorio" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Relatórios
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="catalogo" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Produtos em Estoque
                </h3>
                <Dialog open={isProdutoDialogOpen} onOpenChange={setIsProdutoDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      <PlusCircle className="h-4 w-4 mr-2"/>
                      Adicionar Produto
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        Novo Produto
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label>Nome do Produto</Label>
                        <Input 
                          value={novoProduto.nome} 
                          onChange={e => setNovoProduto({...novoProduto, nome: e.target.value})} 
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Custo do Distribuidor (R$)</Label>
                        <Input 
                          type="number" 
                          value={novoProduto.custo} 
                          onChange={e => setNovoProduto({...novoProduto, custo: e.target.value})} 
                          placeholder="Ex: 15.50"
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Estoque Inicial</Label>
                        <Input 
                          type="number" 
                          value={novoProduto.estoque} 
                          onChange={e => setNovoProduto({...novoProduto, estoque: e.target.value})} 
                          className="focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={handleAddProduto} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                        Salvar Produto
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-200/60 dark:border-slate-700/60">
                      <TableHead className="font-semibold">Produto</TableHead>
                      <TableHead className="font-semibold">Custo (Distribuidor)</TableHead>
                      <TableHead className="font-semibold">Estoque Atual</TableHead>
                      <TableHead className="font-semibold">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-200/60 dark:border-slate-700/60">
                          <TableCell><Skeleton className="h-4 w-32"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-20"/></TableCell>
                          <TableCell><Skeleton className="h-4 w-24"/></TableCell>
                        </TableRow>
                      ))
                    ) : produtos.length > 0 ? (
                      produtos.map(p => (
                        <TableRow key={p.id} className="border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                          <TableCell className="font-medium">{p.nome_produto}</TableCell>
                          <TableCell className="text-green-600 dark:text-green-400 font-medium">R$ {p.custo_distribuidor.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={p.estoque_atual > 10 ? "secondary" : "destructive"}>
                              {p.estoque_atual} unidades
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">R$ {(p.custo_distribuidor * p.estoque_atual).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-12">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-900 dark:text-slate-100">Nenhum produto encontrado</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Adicione o primeiro produto para começar</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="registro" className="space-y-4">
              <div className="max-w-md mx-auto">
                <Card className="border border-slate-200 dark:border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-center flex items-center justify-center gap-2">
                      <Activity className="h-5 w-5 text-primary" />
                      Registrar Consumo
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Médico
                      </Label>
                      <select 
                        value={logConsumo.medicoId} 
                        onChange={e => setLogConsumo({...logConsumo, medicoId: e.target.value})} 
                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="">Selecione...</option>
                        {medicos.map(m => <option key={m.id} value={m.id}>{m.nome_completo}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Paciente (Opcional)
                      </Label>
                      <select 
                        value={logConsumo.pacienteId} 
                        onChange={e => setLogConsumo({...logConsumo, pacienteId: e.target.value})} 
                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="">Selecione...</option>
                        {pacientes.map(p => <option key={p.id} value={p.id}>{p.nome_completo}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Produto
                      </Label>
                      <select 
                        value={logConsumo.produtoId} 
                        onChange={e => setLogConsumo({...logConsumo, produtoId: e.target.value})} 
                        className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                      >
                        <option value="">Selecione...</option>
                        {produtos.map(p => <option key={p.id} value={p.id}>{p.nome_produto}</option>)}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantidade Utilizada</Label>
                      <Input 
                        type="number" 
                        value={logConsumo.quantidade} 
                        onChange={e => setLogConsumo({...logConsumo, quantidade: e.target.value})} 
                        className="focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    
                    <Button onClick={handleLogConsumo} className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                      <Activity className="h-4 w-4 mr-2" />
                      Registrar Consumo
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="relatorio" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Relatório de Consumo por Médico
                </h3>
                <div className="flex items-end space-x-2 mb-6">
                  <div className="flex-grow space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Médico
                    </Label>
                    <select 
                      value={filtroRelatorio.medicoId} 
                      onChange={e => setFiltroRelatorio({medicoId: e.target.value})} 
                      className="w-full p-3 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    >
                      <option value="">Selecione um médico</option>
                      {medicos.map(m => <option key={m.id} value={m.id}>{m.nome_completo}</option>)}
                    </select>
                  </div>
                  <Button onClick={fetchConsumo} className="bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                    Buscar Relatório
                  </Button>
                </div>
                
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-200/60 dark:border-slate-700/60">
                        <TableHead className="font-semibold">Data</TableHead>
                        <TableHead className="font-semibold">Produto</TableHead>
                        <TableHead className="font-semibold">Quantidade</TableHead>
                        <TableHead className="font-semibold">Paciente</TableHead>
                        <TableHead className="font-semibold">Custo (Repasse)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {consumo.length > 0 ? (
                        consumo.map(c => (
                          <TableRow key={c.id} className="border-slate-200/60 dark:border-slate-700/60 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3 text-slate-400" />
                                {new Date(c.created_at).toLocaleDateString('pt-BR')}
                              </div>
                            </TableCell>
                            <TableCell className="font-medium">
                              {c.produtos && c.produtos.length > 0 ? c.produtos[0].nome_produto : 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{c.quantidade}x</Badge>
                            </TableCell>
                            <TableCell className="text-slate-600 dark:text-slate-400">
                              {c.pacientes && c.pacientes.length > 0 ? c.pacientes[0].nome_completo : 'N/A'}
                            </TableCell>
                            <TableCell className="font-medium text-green-600 dark:text-green-400">
                              R$ {c.custo_total_no_momento.toFixed(2)}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-12">
                            <div className="flex flex-col items-center gap-3">
                              <BarChart3 className="h-12 w-12 text-slate-300 dark:text-slate-600" />
                              <div>
                                <p className="font-medium text-slate-900 dark:text-slate-100">Nenhum consumo encontrado</p>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Selecione um médico para ver o relatório</p>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

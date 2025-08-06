// src/components/Layout.tsx
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { supabase } from "../lib/supabaseClient";
import { ThemeToggle } from "./ThemeToggle";
import { CalendarDays, Users, Hospital, Stethoscope, Warehouse, CircleDollarSign, LogOut, Menu, X } from 'lucide-react';
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { toast } from "sonner";

const navItems = [
  { to: "/dashboard/agenda", icon: CalendarDays, label: "Agenda" },
  { to: "/dashboard/pacientes", icon: Users, label: "Pacientes" },
  { to: "/dashboard/salas", icon: Hospital, label: "Salas" },
  { to: "/dashboard/medicos", icon: Stethoscope, label: "Médicos" },
  { to: "/dashboard/estoque", icon: Warehouse, label: "Estoque" },
  { to: "/dashboard/financeiro", icon: CircleDollarSign, label: "Financeiro" },
];

export function Layout() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se usuário está logado
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.info("Sua sessão expirou. Por favor, faça login novamente.");
          navigate('/login');
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        toast.error("Não foi possível verificar a autenticação. Verifique sua conexão ou as configurações.");
        navigate('/login');
      }
    };

    checkAuth();
  }, [navigate]);

  async function handleLogout() {
    try {
      await supabase.auth.signOut();
      toast.success("Logout realizado com sucesso!");
      navigate('/login');
    } catch (error) {
      toast.error("Erro ao fazer logout");
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-slate-600 dark:text-slate-400">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 transform bg-white/80 backdrop-blur-xl border-r border-slate-200/60 
        dark:bg-slate-900/80 dark:border-slate-700/60 transition-transform duration-300 ease-in-out
        sm:relative sm:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex h-16 items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 px-6">
          <a href="/dashboard" className="flex items-center gap-3 font-bold text-xl">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-lg flex items-center justify-center">
              <Hospital className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
              ClinicaOS
            </span>
          </a>
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="flex-1 space-y-2 p-4">
          {navItems.map((item) => (
            <NavLink 
              key={item.to} 
              to={item.to}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200
                hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:scale-[1.02] hover:shadow-sm
                ${isActive 
                  ? "bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border border-primary/20 shadow-sm" 
                  : "text-slate-600 dark:text-slate-300"
                }
              `}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-slate-200/60 dark:border-slate-700/60 p-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-center">
            © 2024 HyperWorksCreative
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <header className="flex h-16 items-center justify-between gap-4 border-b border-slate-200/60 dark:border-slate-700/60 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80 px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-white text-sm">
                  U
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout}
                className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

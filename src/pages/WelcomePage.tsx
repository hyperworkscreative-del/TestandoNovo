// src/pages/WelcomePage.tsx
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Hospital, CalendarDays, Users, CircleDollarSign, Warehouse, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: CalendarDays,
    title: "Agenda Inteligente",
    description: "Organize consultas e procedimentos com uma visão clara e integrada do seu dia.",
  },
  {
    icon: Users,
    title: "CRM de Pacientes",
    description: "Gerencie o histórico e o relacionamento com seus pacientes de forma eficiente.",
  },
  {
    icon: CircleDollarSign,
    title: "Gestão Financeira",
    description: "Controle despesas, faturamento e gere relatórios financeiros completos.",
  },
  {
    icon: Warehouse,
    title: "Controle de Estoque",
    description: "Monitore o uso de produtos e materiais para nunca ser pego de surpresa.",
  },
];

export function WelcomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex flex-col items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-5xl mx-auto text-center">
        
        {/* Logo and Brand */}
        <div className="mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-blue-600 rounded-3xl shadow-lg mb-4">
            <Hospital className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Bem-vindo ao ClinicaOS
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-4 text-lg max-w-2xl mx-auto">
            A solução completa para otimizar a gestão da sua clínica, unindo eficiência, tecnologia e cuidado.
          </p>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card 
              key={feature.title} 
              className="border-0 shadow-lg bg-white/50 backdrop-blur-xl dark:bg-slate-900/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              style={{ animationDelay: `${index * 150}ms`, animationFillMode: 'backwards' }}
            >
              <CardHeader className="items-center">
                <div className="p-3 bg-primary/10 rounded-full mb-3">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Button */}
        <div className="animate-fade-in-up">
          <Button asChild size="lg" className="h-14 text-lg px-10 bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-white font-bold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105">
            <Link to="/login">
              Acessar o Sistema
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>

      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-4 text-center text-sm text-slate-500 dark:text-slate-400">
        © 2024 HyperWorksCreative. Todos os direitos reservados.
      </footer>
    </div>
  );
}

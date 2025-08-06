// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { WelcomePage } from "./pages/WelcomePage"; // Adicionado
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { Toaster } from "./components/ui/toaster";
import { Layout } from "./components/Layout";
import { Scheduler } from "./components/Scheduler";
import { PatientCRM } from "./components/PatientCRM";
import { RoomManager } from "./components/RoomManager";
import { DoctorManager } from "./components/DoctorManager";
import { InventoryManager } from "./components/InventoryManager";
import { FinancialManager } from "./components/FinancialManager";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rota raiz agora é a página de boas-vindas */}
        <Route path="/" element={<WelcomePage />} />
        
        {/* Rotas de autenticação */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Rotas do dashboard */}
        <Route path="/dashboard" element={<Layout />}>
          <Route index element={<Scheduler />} />
          <Route path="agenda" element={<Scheduler />} />
          <Route path="pacientes" element={<PatientCRM />} />
          <Route path="salas" element={<RoomManager />} />
          <Route path="medicos" element={<DoctorManager />} />
          <Route path="estoque" element={<InventoryManager />} />
          <Route path="financeiro" element={<FinancialManager />} />
        </Route>

        {/* Catch all - redireciona para a página de boas-vindas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster richColors />
    </BrowserRouter>
  )
}

export default App

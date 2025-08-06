import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from './lib/supabaseClient'
import { User } from '@supabase/supabase-js'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import WelcomePage from './pages/WelcomePage'
import './App.css'

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Verificar se há um usuário logado
    const getSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Erro ao verificar sessão:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        {/* Rota pública - Página de boas-vindas */}
        <Route path="/welcome" element={<WelcomePage />} />
        
        {/* Rotas de autenticação */}
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" />} />
        
        {/* Rotas protegidas */}
        <Route path="/dashboard/*" element={user ? <Layout /> : <Navigate to="/welcome" />} />
        
        {/* Rota raiz - redireciona baseado no estado de autenticação */}
        <Route path="/" element={user ? <Navigate to="/dashboard" /> : <Navigate to="/welcome" />} />
      </Routes>
    </Router>
  )
}

export default App

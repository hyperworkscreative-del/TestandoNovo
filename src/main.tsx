import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Adicionar logs para debug
console.log('🚀 Iniciando aplicação ClinicaOS...')

const rootElement = document.getElementById('root')
if (!rootElement) {
  console.error('❌ Elemento root não encontrado!')
} else {
  console.log('✅ Elemento root encontrado, renderizando app...')
}

createRoot(rootElement!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

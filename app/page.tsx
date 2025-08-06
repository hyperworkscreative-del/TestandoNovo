import { Navigate } from 'react-router-dom'

export default function Page() {
  // Redireciona para a página de boas-vindas
  return <Navigate to="/" replace />
}

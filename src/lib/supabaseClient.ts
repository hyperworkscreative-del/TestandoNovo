import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Variáveis de ambiente do Supabase não encontradas. Verifique seu arquivo .env")
  // Em desenvolvimento, não quebrar a aplicação
  if (import.meta.env.DEV) {
    console.warn("Executando em modo de desenvolvimento sem Supabase configurado")
  }
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

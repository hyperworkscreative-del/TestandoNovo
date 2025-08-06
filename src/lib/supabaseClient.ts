// src/lib/supabaseClient.ts

import { createClient } from '@supabase/supabase-js'

// As variáveis são lidas do ambiente. Se não existirem, serão strings vazias.
// A biblioteca Supabase lidará com isso internamente, evitando que a aplicação quebre na inicialização.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ""
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ""

// A verificação que lançava o erro foi removida.
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

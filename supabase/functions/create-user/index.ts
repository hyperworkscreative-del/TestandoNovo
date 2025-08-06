import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  // Trata a requisição OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, password, nome_completo, funcao, clinica_id } = await req.json()
    if (!email || !password || !nome_completo || !funcao || !clinica_id) {
      throw new Error("Email, senha, nome completo, função e ID da clínica são obrigatórios.")
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // 1. Cria o usuário no sistema de autenticação
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Requer que o usuário confirme o email
      user_metadata: { nome_completo: nome_completo }
    })

    if (authError) throw authError;

    const userId = authData.user.id;

    // 2. Insere o perfil do usuário na tabela 'perfis'
    const { error: profileError } = await supabaseAdmin.from('perfis').insert({
      id: userId,
      nome_completo: nome_completo,
      funcao: funcao,
      clinica_id: clinica_id
    })

    if (profileError) throw profileError;

    return new Response(JSON.stringify({ message: "Usuário criado com sucesso", userId: userId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})

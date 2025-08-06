// Permite requisições do ambiente de desenvolvimento local e da URL de produção definida em env
const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Adiciona a URL de produção se ela estiver definida
const prodUrl = Deno.env.get('PRODUCTION_URL');
if (prodUrl) {
  allowedOrigins.push(prodUrl);
}

// Define a origem com base no cabeçalho da requisição
export const getCorsHeaders = (origin: string | null) => {
    const allowedOrigin = (origin && allowedOrigins.includes(origin)) ? origin : allowedOrigins[0];
    
    return {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    };
}

// Headers CORS padrão para compatibilidade com código existente
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
}

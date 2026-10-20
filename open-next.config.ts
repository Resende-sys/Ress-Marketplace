import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Sem cache incremental: as páginas da loja são geradas a cada acesso,
// direto do Supabase (simples e sem custo extra no plano grátis).
export default defineCloudflareConfig({});

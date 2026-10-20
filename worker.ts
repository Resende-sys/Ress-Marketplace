// Ponto de entrada no Cloudflare: repassa os acessos para o site (gerado em
// .open-next pelo `opennextjs-cloudflare build`) e roda o despertador diário.
// @ts-expect-error -- arquivo gerado no build
import { default as site } from "./.open-next/worker.js";

type Env = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
};

export default {
  fetch: site.fetch,

  // O Supabase grátis pausa o projeto após 7 dias sem consultas ao banco.
  // Uma consulta leve por dia evita isso mesmo se a loja ficar sem visitas.
  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const url = env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return;
    ctx.waitUntil(
      fetch(`${url}/rest/v1/licenses?select=id&limit=1`, { headers: { apikey: key } }).then((res) =>
        console.log(`[despertador] Supabase respondeu ${res.status}`),
      ),
    );
  },
} satisfies ExportedHandler<Env>;

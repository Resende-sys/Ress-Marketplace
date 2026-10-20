# RESS Beats — loja de beats

Site para vender meus beats com licenças (Básica, Premium, Trackout, Exclusiva), no estilo BeatStars, mas só com o meu catálogo — com Pix e preço em reais.

Feito com **Next.js**, hospedado na **Cloudflare** (Workers + R2), com **Supabase** para banco de dados e login.

## O que já funciona
- Catálogo com busca e filtros por gênero e mood
- Player fixo no rodapé (continua tocando enquanto navega)
- Página de cada beat com escolha de licença
- Seção de licenças com preços
- Painel admin em `/admin`: login, upload de beats (prévia, capa, MP3, WAV, stems — **sem limite de 50 MB**, com barra de progresso e envio em partes para arquivos grandes), substituir/remover arquivos, publicar/ocultar, editar preços das licenças
- "Despertador" diário que impede o Supabase grátis de pausar

## Próximas etapas
1. Checkout (Mercado Pago / Pix) e entrega automática por e-mail com contrato em PDF
2. Envio em lote dos beats antigos
3. Domínio próprio

## Configuração
1. **Banco (Supabase), uma vez:** SQL Editor → rode [`supabase/schema.sql`](supabase/schema.sql); crie seu usuário em Authentication → Users → Add user (marque *Auto Confirm User*); rode [`supabase/002_admin.sql`](supabase/002_admin.sql) trocando `SEU_EMAIL_AQUI` pelo seu e-mail.
2. **Hospedagem e arquivos (Cloudflare):** siga o passo a passo em [`docs/CLOUDFLARE.md`](docs/CLOUDFLARE.md).

## Para desenvolvedores
```bash
npm install
npm run dev        # http://localhost:3000 (Next.js normal)
npm run preview    # build da Cloudflare rodando localmente
npm run deploy     # publica na Cloudflare (precisa de login no wrangler)
```

- Variáveis públicas: `.env.production` (versionado). Para desenvolvimento local, crie `.env.local` (veja `.env.example`).
- Segredos do R2 (`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`): no painel da Cloudflare, ou em `.dev.vars` localmente.
- Nome e textos da marca: `src/lib/site.ts`; cor de destaque: `src/app/globals.css` (`--accent`).

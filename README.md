# RESS Beats — loja de beats

Site para vender meus beats com licenças (Básica, Premium, Trackout, Exclusiva), no estilo BeatStars, mas só com o meu catálogo.

Feito com **Next.js** (site) + **Supabase** (banco de dados e arquivos).

## O que já funciona
- Catálogo com busca e filtros por gênero e mood
- Player fixo no rodapé (continua tocando enquanto navega)
- Página de cada beat com escolha de licença
- Seção de licenças com preços
- Painel admin em `/admin`: login, upload de beats (prévia, capa, MP3, WAV, stems), publicar/ocultar, editar preços das licenças

## Próximas etapas
1. Checkout (Mercado Pago / Pix) e entrega automática por e-mail com contrato em PDF
2. Publicação na Vercel com domínio próprio

## Configurar o banco (uma vez)
1. Supabase → **SQL Editor** → **New query**
2. Cole o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**

Isso cria as tabelas de beats e licenças, com 4 beats de exemplo. Depois:

3. Authentication → Users → **Add user** → **Create new user** (marque *Auto Confirm User*)
4. Rode [`supabase/002_admin.sql`](supabase/002_admin.sql) trocando `SEU_EMAIL_AQUI` pelo e-mail do passo 3

Isso libera o painel `/admin` só para você e cria as pastas de arquivos (a de masters/stems é privada). Enquanto o banco não está configurado, o site mostra os mesmos beats de demonstração.

## Rodar localmente (para desenvolvedores)
```bash
cp .env.example .env.local   # preencha com a URL e a publishable key do Supabase
npm install
npm run dev                  # http://localhost:3000
```

Nome e textos da marca ficam em `src/lib/site.ts`; a cor de destaque em `src/app/globals.css` (`--accent`).

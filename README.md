# RESS Beats — loja de beats

Site para vender meus beats com licenças (Básica, Premium, Trackout, Exclusiva), no estilo BeatStars, mas só com o meu catálogo — com Pix e preço em reais.

Feito com **Next.js**, hospedado na **Cloudflare** (Workers + R2), com **Supabase** para banco de dados e login.

## O que já funciona
**Loja (pública)** — visual futurista preto + carmesim, adaptado para celular:
- Página inicial: apresentação, faixa "Já trabalhei com", beats (Populares / Lançamentos / Todos), catálogos, licenças, packs, lista de e-mails e contato
- Beats com busca e filtros (gênero, mood, tom, faixa de BPM); player fixo que continua tocando
- Catálogos (playlists) com "Tocar tudo"
- Escolha de licença com termos de uso, carrinho e checkout (pagamento online em breve; por enquanto finaliza pelo WhatsApp/e-mail com o pedido pronto)
- Páginas de Licenças (com perguntas frequentes), Packs, Sobre e Contato

**Painel (`/admin`)**:
- Beats (com catálogo, duração automática, download grátis opcional), Catálogos (capa, nome, tags, escolha dos beats), Packs/sound kits (zip, capa, descrição, preço único e preço "de"), Licenças (com destaque "Mais popular"), Sobre (textos, foto, contatos, redes, artistas, faixa de aviso) e Lista de e-mails (com exportação .csv)
- Uploads direto para o Cloudflare R2, sem limite de 50 MB, com barra de progresso
- "Despertador" diário que impede o Supabase grátis de pausar

## Próximas etapas
1. Checkout (Mercado Pago / Pix) e entrega automática por e-mail com contrato em PDF
2. Envio em lote dos beats antigos
3. Domínio próprio

## Configuração
1. **Banco (Supabase), uma vez:** SQL Editor → rode [`supabase/schema.sql`](supabase/schema.sql); crie seu usuário em Authentication → Users → Add user (marque *Auto Confirm User*); rode [`supabase/002_admin.sql`](supabase/002_admin.sql) trocando `SEU_EMAIL_AQUI` pelo seu e-mail; e por fim rode [`supabase/003_marketplace.sql`](supabase/003_marketplace.sql).
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
- Textos, contatos e artistas: painel → Sobre. Cores do tema: `src/app/globals.css` (`--accent` etc.).

# Colocando o site na Cloudflare

Arquitetura:

| Peça | Serviço | Plano |
|---|---|---|
| Site | Cloudflare Workers | Grátis (100 mil acessos/dia) |
| Arquivos (capas, prévias, MP3, WAV, stems) | Cloudflare R2 | 10 GB grátis, depois ~US$ 0,015/GB/mês |
| Banco de dados + login do admin | Supabase | Grátis |
| "Despertador" do Supabase | Cron do próprio Worker (todo dia, 09:17 UTC) | Grátis |

> Nunca mande as chaves **secretas** (R2 Secret Access Key, service_role do Supabase) no chat.
> Elas vão direto no painel da Cloudflare, como **Secret**.

---

## 1. Criar a conta
1. Acesse **dash.cloudflare.com** → **Sign up** (pode usar o Google/GitHub).

## 2. Ativar o R2 e criar as pastas (buckets)
1. Menu lateral → **R2 Object Storage** → ative o R2.
   Pode pedir um cartão: até 10 GB é grátis; acima disso cobra centavos por GB.
2. **Create bucket** → nome `ress-public` → Create.
3. **Create bucket** → nome `ress-masters` → Create.

| Bucket | Guarda | Acesso |
|---|---|---|
| `ress-public` | capas e prévias com tag de voz | público (qualquer um ouve/vê) |
| `ress-masters` | MP3/WAV sem tag e stems | **privado** (só sai por link de compra) |

## 3. Deixar o `ress-public` acessível
1. Abra `ress-public` → **Settings** → **Public access** → **R2.dev subdomain** → **Allow**.
2. Copie o endereço que aparece (algo como `https://pub-xxxxxxxx.r2.dev`) e **mande para o Claude** — ele é público, pode mandar.
   (Depois, com domínio próprio, dá para trocar por algo como `arquivos.seusite.com.br`.)

## 4. Liberar o envio pelo navegador (CORS)
Faça nos **dois** buckets: abra o bucket → **Settings** → **CORS Policy** → **Add CORS policy** → cole:

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

O `ETag` é obrigatório: sem ele, arquivos grandes (enviados em partes) não conseguem ser finalizados.

## 5. Criar a chave de acesso ao R2
1. Página do **R2** → **Manage R2 API Tokens** (ou **API Tokens**) → **Create API token**.
2. Permissão: **Object Read & Write**. Buckets: `ress-public` e `ress-masters`.
3. Crie e **guarde** (aparecem uma vez só):
   - **Access Key ID**
   - **Secret Access Key**
   - **Account ID** (também aparece na página inicial do R2)

## 6. Publicar o site (Workers ligado ao GitHub)
1. Menu lateral → **Workers & Pages** → **Create** → **Import a repository** → conecte o GitHub → escolha **Ress-Marketplace**.
2. Configuração:
   - **Project name:** `ress-marketplace`
   - **Branch:** a branch do projeto (`claude/fervent-goldberg-rfb39f`)
   - **Build command:** `npx opennextjs-cloudflare build`
   - **Deploy command:** `npx opennextjs-cloudflare deploy`
3. **Deploy**. Ao terminar, o site fica em `https://ress-marketplace.<seu-usuario>.workers.dev`.

A partir daí, cada atualização no GitHub publica o site sozinha.

## 7. Cadastrar as chaves secretas no Worker
Worker `ress-marketplace` → **Settings** → **Variables and Secrets** → **Add**, tipo **Secret**, uma de cada vez:

| Nome | Valor |
|---|---|
| `R2_ACCOUNT_ID` | Account ID do passo 5 |
| `R2_ACCESS_KEY_ID` | Access Key ID do passo 5 |
| `R2_SECRET_ACCESS_KEY` | Secret Access Key do passo 5 |

Salve (**Deploy**).

## 8. Testar
1. Abra `https://ress-marketplace.<seu-usuario>.workers.dev/admin` e entre.
2. Edite um beat e envie uma stem grande — a barra mostra a porcentagem.
3. Confira no R2 → `ress-masters` que o arquivo apareceu.

## 9. Desligar a Vercel
Depois que tudo funcionar na Cloudflare: Vercel → projeto → **Settings** → **General** → **Delete Project**.

---

### Valores públicos já configurados no código
Ficam em `.env.production` (são públicos por natureza):
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `NEXT_PUBLIC_R2_PUBLIC_URL` — endereço do passo 3

### Opcionais
- `R2_PUBLIC_BUCKET` / `R2_PRIVATE_BUCKET` — se usar nomes de bucket diferentes de `ress-public` / `ress-masters`.

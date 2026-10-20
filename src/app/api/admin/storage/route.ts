import { createClient } from "@supabase/supabase-js";
import {
  abortMultipart,
  completeMultipart,
  createMultipart,
  deleteObject,
  presignPart,
  presignPut,
} from "@/lib/r2";
import { BUCKETS, type Bucket, isValidKey } from "@/lib/storage-shared";

// Operações de arquivo do painel admin. O navegador envia os arquivos
// direto para o R2 usando links assinados que esta rota gera — assim
// arquivos grandes (stems) não passam pelo servidor do site.

async function isAdmin(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !key) return false;
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data, error } = await supabase.rpc("is_admin");
  return !error && data === true;
}

type Body = {
  action?: string;
  bucket?: string;
  key?: string;
  keys?: string[];
  contentType?: string;
  uploadId?: string;
  partNumber?: number;
  parts?: { partNumber: number; etag: string }[];
};

export async function POST(request: Request) {
  if (!(await isAdmin(request))) {
    return Response.json({ error: "Acesso negado." }, { status: 401 });
  }

  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const bucket = body.bucket as Bucket;
  if (!BUCKETS.includes(bucket)) return Response.json({ error: "Pasta inválida." }, { status: 400 });

  try {
    switch (body.action) {
      case "delete": {
        const keys = (body.keys ?? []).filter(isValidKey);
        await Promise.all(keys.map((k) => deleteObject(bucket, k)));
        return Response.json({ ok: true });
      }
    }

    const key = body.key;
    if (!isValidKey(key)) return Response.json({ error: "Nome de arquivo inválido." }, { status: 400 });

    switch (body.action) {
      case "put":
        return Response.json({ url: await presignPut(bucket, key) });
      case "create":
        return Response.json({ uploadId: await createMultipart(bucket, key, body.contentType) });
      case "part": {
        const n = body.partNumber;
        if (!body.uploadId || !Number.isInteger(n) || n! < 1 || n! > 10000) {
          return Response.json({ error: "Parte inválida." }, { status: 400 });
        }
        return Response.json({ url: await presignPart(bucket, key, body.uploadId, n!) });
      }
      case "complete":
        if (!body.uploadId || !body.parts?.length) {
          return Response.json({ error: "Upload incompleto." }, { status: 400 });
        }
        await completeMultipart(bucket, key, body.uploadId, body.parts);
        return Response.json({ ok: true });
      case "abort":
        if (body.uploadId) await abortMultipart(bucket, key, body.uploadId);
        return Response.json({ ok: true });
      default:
        return Response.json({ error: "Ação desconhecida." }, { status: 400 });
    }
  } catch (err) {
    console.error("[storage]", err);
    return Response.json({ error: err instanceof Error ? err.message : "Erro no armazenamento." }, { status: 500 });
  }
}

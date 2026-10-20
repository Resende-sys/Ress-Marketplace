"use client";

import { type Bucket } from "./storage-shared";
import { getSupabase } from "./supabase-browser";

export type { Bucket };

// Arquivos até este tamanho sobem de uma vez; acima disso, em partes
// (se uma parte falhar, só ela é reenviada).
const SINGLE_UPLOAD_MAX = 95 * 1024 * 1024;
const PART_SIZE = 32 * 1024 * 1024;
const PARALLEL_PARTS = 4;
const PART_RETRIES = 3;

const PUBLIC_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace(/\/+$/, "");

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function storageApi<T>(body: Record<string, unknown>): Promise<T> {
  const { data } = await getSupabase().auth.getSession();
  const res = await fetch("/api/admin/storage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${data.session?.access_token ?? ""}`,
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Erro ${res.status} no armazenamento.`);
  return json as T;
}

/** PUT direto no R2 com progresso; devolve o ETag (usado no envio em partes). */
function putWithProgress(url: string, blob: Blob, contentType: string | undefined, onProgress: (loaded: number) => void) {
  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    if (contentType) xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.onprogress = (e) => onProgress(e.loaded);
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve(xhr.getResponseHeader("ETag") ?? "")
        : reject(new Error(`R2 respondeu ${xhr.status}`));
    xhr.onerror = () => reject(new Error("Falha de conexão durante o envio."));
    xhr.send(blob);
  });
}

/**
 * Envia o arquivo para o R2 e devolve a chave dele (guarda o nome original no fim).
 * `onProgress` recebe de 0 a 1.
 */
export async function uploadFile(
  bucket: Bucket,
  folder: string,
  kind: string,
  file: File,
  onProgress: (fraction: number) => void = () => {},
) {
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? slugify(file.name.slice(dot + 1)) || "bin" : "bin";
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || kind;
  const key = `${folder}/${kind}-${Date.now()}-${base}.${ext}`;
  const contentType = file.type || undefined;

  try {
    if (file.size <= SINGLE_UPLOAD_MAX) {
      const { url } = await storageApi<{ url: string }>({ action: "put", bucket, key });
      await putWithProgress(url, file, contentType, (loaded) => onProgress(loaded / file.size));
      onProgress(1);
      return key;
    }
    await uploadMultipart(bucket, key, file, contentType, onProgress);
    return key;
  } catch (err) {
    throw new Error(`Falha ao enviar ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function uploadMultipart(
  bucket: Bucket,
  key: string,
  file: File,
  contentType: string | undefined,
  onProgress: (fraction: number) => void,
) {
  const { uploadId } = await storageApi<{ uploadId: string }>({ action: "create", bucket, key, contentType });
  const total = Math.ceil(file.size / PART_SIZE);
  const loaded = new Array<number>(total + 1).fill(0);
  const parts: { partNumber: number; etag: string }[] = [];
  let next = 1;

  const report = () => onProgress(loaded.reduce((a, b) => a + b, 0) / file.size);

  async function sendPart(partNumber: number) {
    const blob = file.slice((partNumber - 1) * PART_SIZE, partNumber * PART_SIZE);
    for (let attempt = 1; ; attempt++) {
      try {
        const { url } = await storageApi<{ url: string }>({ action: "part", bucket, key, uploadId, partNumber });
        const etag = await putWithProgress(url, blob, undefined, (n) => {
          loaded[partNumber] = n;
          report();
        });
        if (!etag) throw new Error("O R2 não devolveu o ETag (confira a configuração de CORS do bucket).");
        parts.push({ partNumber, etag });
        return;
      } catch (err) {
        loaded[partNumber] = 0;
        if (attempt >= PART_RETRIES) throw err;
      }
    }
  }

  try {
    await Promise.all(
      Array.from({ length: Math.min(PARALLEL_PARTS, total) }, async () => {
        while (next <= total) await sendPart(next++);
      }),
    );
    await storageApi({ action: "complete", bucket, key, uploadId, parts });
    onProgress(1);
  } catch (err) {
    await storageApi({ action: "abort", bucket, key, uploadId }).catch(() => {});
    throw err;
  }
}

/** URL pública de capas e prévias. */
export function publicUrl(bucket: Exclude<Bucket, "masters">, key: string) {
  if (!PUBLIC_BASE) throw new Error("Falta configurar NEXT_PUBLIC_R2_PUBLIC_URL (endereço público do bucket).");
  return `${PUBLIC_BASE}/${bucket}/${key}`;
}

/** Extrai a chave a partir da URL pública (null se não for um arquivo do nosso R2). */
export function pathFromPublicUrl(bucket: Bucket, url: string | null) {
  const prefix = `${PUBLIC_BASE}/${bucket}/`;
  return PUBLIC_BASE && url?.startsWith(prefix) ? url.slice(prefix.length) : null;
}

/** Nome amigável a partir do caminho/URL salvo (tira o prefixo "tipo-timestamp-"). */
export function displayName(pathOrUrl: string) {
  const last = decodeURIComponent(pathOrUrl.split("?")[0].split("/").pop() ?? pathOrUrl);
  return last.replace(/^[a-z0-9]+-\d{10,}-?/, "") || last;
}

export async function removeFiles(bucket: Bucket, keys: (string | null)[]) {
  const valid = keys.filter((k): k is string => !!k);
  if (valid.length) await storageApi({ action: "delete", bucket, keys: valid }).catch(() => {});
}

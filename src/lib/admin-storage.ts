"use client";

import { getSupabase } from "./supabase-browser";

export type Bucket = "covers" | "previews" | "masters";

// Limite por arquivo do plano grátis do Supabase.
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function slugify(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Envia o arquivo e devolve o caminho dentro do bucket (guarda o nome original no fim). */
export async function uploadFile(bucket: Bucket, folder: string, kind: string, file: File) {
  const dot = file.name.lastIndexOf(".");
  const ext = dot > 0 ? file.name.slice(dot + 1).toLowerCase() : "bin";
  const base = slugify(dot > 0 ? file.name.slice(0, dot) : file.name) || kind;
  const path = `${folder}/${kind}-${Date.now()}-${base}.${ext}`;
  const { error } = await getSupabase()
    .storage.from(bucket)
    .upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (error) throw new Error(`Falha ao enviar ${file.name}: ${error.message}`);
  return path;
}

export function publicUrl(bucket: Bucket, path: string) {
  return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** Extrai o caminho de um arquivo a partir da URL pública (null se não for do Supabase). */
export function pathFromPublicUrl(bucket: Bucket, url: string | null) {
  const marker = `/storage/v1/object/public/${bucket}/`;
  const i = url?.indexOf(marker) ?? -1;
  return url && i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

/** Nome amigável a partir do caminho/URL salvo (tira o prefixo "tipo-timestamp-"). */
export function displayName(pathOrUrl: string) {
  const last = decodeURIComponent(pathOrUrl.split("?")[0].split("/").pop() ?? pathOrUrl);
  return last.replace(/^[a-z0-9]+-\d{10,}-?/, "") || last;
}

export async function removeFiles(bucket: Bucket, paths: (string | null)[]) {
  const valid = paths.filter((p): p is string => !!p);
  if (valid.length) await getSupabase().storage.from(bucket).remove(valid);
}

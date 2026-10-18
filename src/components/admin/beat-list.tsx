"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { refreshCatalog } from "@/app/actions";
import { pathFromPublicUrl, removeFiles } from "@/lib/admin-storage";
import { getSupabase } from "@/lib/supabase-browser";
import { Button } from "./ui";

type Row = {
  id: string;
  slug: string;
  title: string;
  bpm: number;
  genre: string;
  published: boolean;
  cover_url: string | null;
  preview_url: string;
  mp3_path: string | null;
  wav_path: string | null;
  stems_path: string | null;
};

export function BeatList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await getSupabase()
      .from("beats")
      .select("id, slug, title, bpm, genre, published, cover_url, preview_url, mp3_path, wav_path, stems_path")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void load();
  }, [load]);

  async function togglePublished(row: Row) {
    const { error } = await getSupabase().from("beats").update({ published: !row.published }).eq("id", row.id);
    if (error) return setError(error.message);
    await refreshCatalog();
    await load();
  }

  async function remove(row: Row) {
    if (!confirm(`Apagar "${row.title}" e todos os arquivos dele? Não dá para desfazer.`)) return;
    const { error } = await getSupabase().from("beats").delete().eq("id", row.id);
    if (error) return setError(error.message);
    await Promise.all([
      removeFiles("covers", [pathFromPublicUrl("covers", row.cover_url)]),
      removeFiles("previews", [pathFromPublicUrl("previews", row.preview_url)]),
      removeFiles("masters", [row.mp3_path, row.wav_path, row.stems_path]),
    ]);
    await refreshCatalog();
    await load();
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seus beats</h1>
        <Link
          href="/admin/beats/novo"
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black hover:brightness-110"
        >
          + Novo beat
        </Link>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      {rows === null ? (
        <p className="text-zinc-400">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-zinc-400">Nenhum beat ainda. Clique em “Novo beat”.</p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-white/10">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.title}</p>
                <p className="text-sm text-zinc-400">
                  {row.bpm} BPM · {row.genre}
                </p>
              </div>
              <div className="flex gap-1.5 text-xs">
                <FileBadge ok={!!row.mp3_path}>MP3</FileBadge>
                <FileBadge ok={!!row.wav_path}>WAV</FileBadge>
                <FileBadge ok={!!row.stems_path}>Stems</FileBadge>
              </div>
              <Button variant="ghost" onClick={() => togglePublished(row)} className="w-32">
                {row.published ? "● Publicado" : "○ Oculto"}
              </Button>
              <Link href={`/admin/beats/${row.id}`} className="rounded-lg bg-white/10 px-4 py-2 text-sm font-semibold hover:bg-white/15">
                Editar
              </Link>
              <Button variant="danger" onClick={() => remove(row)}>
                Apagar
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FileBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      title={ok ? "Arquivo enviado" : "Falta enviar"}
      className={`rounded-full px-2 py-0.5 ${ok ? "bg-accent/15 text-accent" : "bg-white/5 text-zinc-500 line-through"}`}
    >
      {children}
    </span>
  );
}

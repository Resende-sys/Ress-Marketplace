"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cover } from "@/components/cover";
import { pathFromPublicUrl, removeFiles } from "@/lib/admin-storage";
import { getSupabase } from "@/lib/supabase-browser";
import { AdminTitle, Button, ErrorBox } from "./ui";

type Row = {
  id: string;
  slug: string;
  title: string;
  bpm: number;
  genre: string;
  plays: number;
  published: boolean;
  catalog_id: string | null;
  cover_url: string | null;
  preview_url: string;
  mp3_path: string | null;
  wav_path: string | null;
  stems_path: string | null;
};

export function BeatList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [catalogs, setCatalogs] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [beats, cats] = await Promise.all([
      getSupabase()
        .from("beats")
        .select("id, slug, title, bpm, genre, plays, published, catalog_id, cover_url, preview_url, mp3_path, wav_path, stems_path")
        .order("created_at", { ascending: false }),
      getSupabase().from("catalogs").select("id, name"),
    ]);
    if (beats.error) setError(beats.error.message);
    else setRows(beats.data as Row[]);
    setCatalogs(Object.fromEntries((cats.data ?? []).map((c) => [c.id, c.name])));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void load();
  }, [load]);

  const visible = useMemo(
    () => (rows ?? []).filter((r) => !filter || r.title.toLowerCase().includes(filter.toLowerCase())),
    [rows, filter],
  );

  async function togglePublished(row: Row) {
    const { error } = await getSupabase().from("beats").update({ published: !row.published }).eq("id", row.id);
    if (error) return setError(error.message);
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
    await load();
  }

  return (
    <div>
      <AdminTitle eyebrow={rows ? `${rows.length} beats` : "Beats"} title="Seus beats" action={{ href: "/admin/beats/novo", label: "+ Novo beat" }} />
      {error && <div className="mb-4"><ErrorBox>{error}</ErrorBox></div>}

      {rows === null ? (
        <p className="text-muted">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="panel py-12 text-center text-muted">Nenhum beat ainda. Clique em “Novo beat”.</p>
      ) : (
        <>
          <input className="field mb-4 max-w-sm" placeholder="Buscar beat…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          <ul className="panel divide-y divide-line">
            {visible.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
                <Cover src={row.cover_url} seed={row.slug} label={row.title} className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold uppercase">{row.title}</p>
                  <p className="label mt-0.5 truncate !text-[0.58rem] !tracking-[0.14em]">
                    {row.bpm} BPM · {row.genre} · {row.catalog_id ? catalogs[row.catalog_id] ?? "—" : "Sem catálogo"} · {row.plays} plays
                  </p>
                </div>
                <div className="flex gap-1.5">
                  <FileBadge ok={!!row.mp3_path}>MP3</FileBadge>
                  <FileBadge ok={!!row.wav_path}>WAV</FileBadge>
                  <FileBadge ok={!!row.stems_path}>Stems</FileBadge>
                </div>
                <div className="flex w-full gap-2 sm:w-auto">
                  <Button variant="ghost" onClick={() => togglePublished(row)} className="flex-1 !px-3 !py-2 sm:flex-none">
                    <span className={`size-2 rounded-full ${row.published ? "bg-accent shadow-[0_0_8px_var(--glow)]" : "bg-dim"}`} />
                    {row.published ? "Publicado" : "Oculto"}
                  </Button>
                  <Link href={`/admin/beats/${row.id}`} className="btn btn-ghost flex-1 !px-3 !py-2 sm:flex-none">
                    Editar
                  </Link>
                  <Button variant="danger" onClick={() => remove(row)} className="!px-3 !py-2">
                    Apagar
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function FileBadge({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <span
      title={ok ? "Arquivo enviado" : "Falta enviar"}
      className={`rounded-full border px-2 py-0.5 font-mono text-[0.58rem] tracking-[0.1em] uppercase ${
        ok ? "border-accent/50 bg-accent/10 text-accent-hi" : "border-line text-dim line-through"
      }`}
    >
      {children}
    </span>
  );
}

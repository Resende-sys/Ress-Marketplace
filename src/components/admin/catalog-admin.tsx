"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Cover } from "@/components/cover";
import { pathFromPublicUrl, removeFiles, slugify } from "@/lib/admin-storage";
import { getSupabase } from "@/lib/supabase-browser";
import { type FileChanges, type FileField, FileSlot, uploadChanges } from "./file-slot";
import { AdminTitle, Button, ErrorBox, Field, splitList, Toggle } from "./ui";

type CatalogRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  tags: string[];
  cover_url: string | null;
  published: boolean;
  sort_order: number;
};

type BeatRow = { id: string; slug: string; title: string; bpm: number; genre: string; cover_url: string | null; catalog_id: string | null };

const COVER: FileField = { column: "cover_url", bucket: "covers", label: "Capa do catálogo", accept: "image/*", hint: "Imagem quadrada, como capa de playlist." };

export function CatalogList() {
  const [rows, setRows] = useState<CatalogRow[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const [cats, beats] = await Promise.all([
      getSupabase().from("catalogs").select("*").order("sort_order").order("created_at", { ascending: false }),
      getSupabase().from("beats").select("catalog_id"),
    ]);
    if (cats.error) return setError(cats.error.message);
    setRows(cats.data as CatalogRow[]);
    const c: Record<string, number> = {};
    for (const b of beats.data ?? []) if (b.catalog_id) c[b.catalog_id] = (c[b.catalog_id] ?? 0) + 1;
    setCounts(c);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void load();
  }, [load]);

  async function remove(row: CatalogRow) {
    if (!confirm(`Apagar o catálogo "${row.name}"? Os beats dele continuam na loja, só ficam sem catálogo.`)) return;
    const { error } = await getSupabase().from("catalogs").delete().eq("id", row.id);
    if (error) return setError(error.message);
    await removeFiles("covers", [pathFromPublicUrl("covers", row.cover_url)]);
    await load();
  }

  return (
    <div>
      <AdminTitle eyebrow="Playlists" title="Catálogos" action={{ href: "/admin/catalogos/novo", label: "+ Novo catálogo" }} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows === null ? (
        <p className="text-muted">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="panel py-12 text-center text-muted">Nenhum catálogo ainda. Crie o primeiro e depois associe os beats.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {rows.map((c) => (
            <div key={c.id} className="panel overflow-hidden">
              <Link href={`/admin/catalogos/${c.id}`} className="block">
                <Cover src={c.cover_url} seed={c.slug} label={c.name} className="aspect-square w-full" />
              </Link>
              <div className="p-3">
                <p className="truncate font-semibold">{c.name}</p>
                <p className="label mt-1 !text-[0.58rem]">
                  {counts[c.id] ?? 0} beats · {c.published ? "Publicado" : "Oculto"}
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href={`/admin/catalogos/${c.id}`} className="btn btn-ghost flex-1 !px-2 !py-2">
                    Editar
                  </Link>
                  <Button variant="danger" onClick={() => remove(c)} className="!px-3 !py-2" aria-label={`Apagar ${c.name}`}>
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function CatalogForm({ catalogId }: { catalogId?: string }) {
  const router = useRouter();
  const [existing, setExisting] = useState<CatalogRow | null>(null);
  const [beats, setBeats] = useState<BeatRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [published, setPublished] = useState(true);
  const [changes, setChanges] = useState<FileChanges>({});
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const { data: allBeats } = await getSupabase()
        .from("beats")
        .select("id, slug, title, bpm, genre, cover_url, catalog_id")
        .order("created_at", { ascending: false });
      setBeats((allBeats ?? []) as BeatRow[]);
      if (catalogId) {
        const { data, error } = await getSupabase().from("catalogs").select("*").eq("id", catalogId).single<CatalogRow>();
        if (error || !data) setError("Catálogo não encontrado.");
        else {
          setExisting(data);
          setName(data.name);
          setDescription(data.description ?? "");
          setTags(data.tags.join(", "));
          setSortOrder(String(data.sort_order));
          setPublished(data.published);
          setSelected(new Set((allBeats ?? []).filter((b) => b.catalog_id === data.id).map((b) => b.id)));
        }
      }
      setLoading(false);
    })();
  }, [catalogId]);

  const visibleBeats = useMemo(
    () => beats.filter((b) => !filter || b.title.toLowerCase().includes(filter.toLowerCase())),
    [beats, filter],
  );

  function toggleBeat(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const slug = existing?.slug ?? slugify(name);
    if (!slug) return setError("Dê um nome ao catálogo.");

    let rollback: (() => Promise<unknown>) | null = null;
    try {
      const files = await uploadChanges([COVER], changes, existing, `catalogo-${slug}`, setStatus);
      rollback = files.rollback;
      setStatus("Salvando…");
      const row = {
        slug,
        name: name.trim(),
        description: description.trim() || null,
        tags: splitList(tags),
        sort_order: Number(sortOrder) || 0,
        published,
        ...files.columns,
      };
      const res = existing
        ? await getSupabase().from("catalogs").update(row).eq("id", existing.id).select("id").single()
        : await getSupabase().from("catalogs").insert(row).select("id").single();
      if (res.error) throw new Error(res.error.code === "23505" ? "Já existe um catálogo com esse nome." : res.error.message);
      rollback = null;
      const id = res.data.id as string;

      // Beats da playlist: marca os escolhidos e solta os que saíram.
      const add = [...selected];
      const drop = beats.filter((b) => b.catalog_id === id && !selected.has(b.id)).map((b) => b.id);
      if (add.length) {
        const { error } = await getSupabase().from("beats").update({ catalog_id: id }).in("id", add);
        if (error) throw new Error(error.message);
      }
      if (drop.length) {
        const { error } = await getSupabase().from("beats").update({ catalog_id: null }).in("id", drop);
        if (error) throw new Error(error.message);
      }

      await files.cleanupOld();
      router.push("/admin/catalogos");
    } catch (err) {
      await rollback?.();
      setError(err instanceof Error ? err.message : String(err));
      setStatus("");
    }
  }

  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <form onSubmit={save} className="space-y-8">
      <AdminTitle eyebrow={existing ? "Editar catálogo" : "Novo catálogo"} title={existing ? existing.name : "Criar playlist"} />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        <div className="space-y-4">
          <FileSlot
            field={COVER}
            current={existing?.cover_url ?? null}
            change={changes.cover_url}
            disabled={!!status}
            onChange={(c) => setChanges((p) => ({ ...p, cover_url: c }))}
          />
          <section className="panel space-y-4 p-5">
            <Field label="Nome" hint={existing ? `Endereço: /catalogos/${existing.slug}` : undefined}>
              <input required className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
            <Field label="Descrição">
              <textarea rows={3} className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
            <Field label="Tags" hint="Separe por vírgula: trap, dark, 2026">
              <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} />
            </Field>
            <Field label="Ordem" hint="Menor número aparece primeiro.">
              <input type="number" className="field w-28" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
            </Field>
            <Toggle checked={published} onChange={setPublished} label="Publicado (aparece na loja)" />
          </section>
        </div>

        <section className="panel flex max-h-[38rem] flex-col p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="label">Beats na playlist · {selected.size}</p>
            <input className="field max-w-[12rem] !py-2" placeholder="Buscar…" value={filter} onChange={(e) => setFilter(e.target.value)} />
          </div>
          {beats.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Nenhum beat cadastrado ainda.</p>
          ) : (
            <ul className="-mx-2 flex-1 space-y-1 overflow-y-auto px-2">
              {visibleBeats.map((b) => {
                const on = selected.has(b.id);
                const elsewhere = !on && b.catalog_id && b.catalog_id !== existing?.id;
                return (
                  <li key={b.id}>
                    <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2 transition ${on ? "border-accent/60 bg-accent/10" : "border-transparent hover:bg-white/[0.03]"}`}>
                      <input type="checkbox" checked={on} onChange={() => toggleBeat(b.id)} className="range-accent size-4" />
                      <Cover src={b.cover_url} seed={b.slug} label={b.title} className="size-10 shrink-0 rounded-md" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold uppercase">{b.title}</span>
                        <span className="label !text-[0.55rem]">
                          {b.bpm} BPM · {b.genre}
                          {elsewhere ? " · em outro catálogo" : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-dim">Cada beat fica em um catálogo só: marcar aqui tira ele do catálogo anterior.</p>
        </section>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!!status}>
          {status || "Salvar catálogo"}
        </Button>
        <Link href="/admin/catalogos" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function EditCatalogForm() {
  const { id } = useParams<{ id: string }>();
  return <CatalogForm key={id} catalogId={id} />;
}

"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { slugify } from "@/lib/admin-storage";
import { getSupabase } from "@/lib/supabase-browser";
import { type FileChanges, type FileField, FileSlot, missingRequired, uploadChanges } from "./file-slot";
import { AdminTitle, Button, ErrorBox, Field, splitList, Toggle } from "./ui";

type Existing = {
  id: string;
  slug: string;
  title: string;
  bpm: number;
  musical_key: string | null;
  genre: string;
  moods: string[];
  tags: string[];
  published: boolean;
  catalog_id: string | null;
  free_download: boolean;
  duration_seconds: number | null;
  cover_url: string | null;
  preview_url: string;
  mp3_path: string | null;
  wav_path: string | null;
  stems_path: string | null;
};

const FILE_FIELDS: FileField[] = [
  { column: "preview_url", bucket: "previews", label: "Prévia (com tag de voz)", accept: "audio/mpeg,.mp3", hint: "MP3 público que toca no site.", required: true },
  { column: "cover_url", bucket: "covers", label: "Capa", accept: "image/*", hint: "Imagem quadrada (ex: 1000×1000). Opcional." },
  { column: "mp3_path", bucket: "masters", label: "MP3 sem tag", accept: "audio/mpeg,.mp3", hint: "Entregue na licença básica." },
  { column: "wav_path", bucket: "masters", label: "WAV", accept: "audio/wav,.wav", hint: "Entregue na Premium em diante." },
  { column: "stems_path", bucket: "masters", label: "Stems (.zip)", accept: ".zip,application/zip", hint: "Entregue na Trackout/Exclusiva." },
];

/** Lê a duração de um arquivo de áudio no navegador. */
function audioDuration(file: File) {
  return new Promise<number | null>((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.preload = "metadata";
    audio.onloadedmetadata = () => {
      resolve(Number.isFinite(audio.duration) ? Math.round(audio.duration) : null);
      URL.revokeObjectURL(url);
    };
    audio.onerror = () => resolve(null);
    audio.src = url;
  });
}

export function BeatForm({ beatId }: { beatId?: string }) {
  const router = useRouter();
  const [existing, setExisting] = useState<Existing | null>(null);
  const [loading, setLoading] = useState(!!beatId);
  const [catalogs, setCatalogs] = useState<{ id: string; name: string }[]>([]);
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [genre, setGenre] = useState("");
  const [moods, setMoods] = useState("");
  const [tags, setTags] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [published, setPublished] = useState(true);
  const [freeDownload, setFreeDownload] = useState(false);
  const [duration, setDuration] = useState<number | null>(null);
  const [changes, setChanges] = useState<FileChanges>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      .from("catalogs")
      .select("id, name")
      .order("sort_order")
      .order("created_at", { ascending: false })
      .then(({ data }) => setCatalogs(data ?? []));
    if (!beatId) return;
    getSupabase()
      .from("beats")
      .select("*")
      .eq("id", beatId)
      .single<Existing>()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return setError("Beat não encontrado.");
        setExisting(data);
        setTitle(data.title);
        setBpm(String(data.bpm));
        setMusicalKey(data.musical_key ?? "");
        setGenre(data.genre);
        setMoods(data.moods.join(", "));
        setTags(data.tags.join(", "));
        setCatalogId(data.catalog_id ?? "");
        setPublished(data.published);
        setFreeDownload(data.free_download);
        setDuration(data.duration_seconds);
      });
  }, [beatId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const missing = missingRequired(FILE_FIELDS, changes, existing);
    if (missing) return setError(`${missing.label} é obrigatória.`);
    if (catalogs.length > 0 && !catalogId) return setError("Escolha o catálogo do beat.");

    const slug = existing?.slug ?? slugify(title);
    if (!slug) return setError("Dê um título ao beat.");

    let rollback: (() => Promise<unknown>) | null = null;
    try {
      const files = await uploadChanges(FILE_FIELDS, changes, existing, slug, setStatus);
      rollback = files.rollback;

      setStatus("Salvando…");
      const row = {
        slug,
        title: title.trim(),
        bpm: Number(bpm),
        musical_key: musicalKey.trim() || null,
        genre: genre.trim(),
        moods: splitList(moods),
        tags: splitList(tags).map((t) => t.replace(/^#/, "").toLowerCase()),
        catalog_id: catalogId || null,
        published,
        free_download: freeDownload,
        duration_seconds: duration,
        ...files.columns,
      };

      const { error } = existing
        ? await getSupabase().from("beats").update(row).eq("id", existing.id)
        : await getSupabase().from("beats").insert(row);
      if (error) {
        throw new Error(error.code === "23505" ? "Já existe um beat com esse nome. Escolha outro título." : error.message);
      }
      rollback = null;
      await files.cleanupOld();
      router.push("/admin");
    } catch (err) {
      await rollback?.();
      setError(err instanceof Error ? err.message : String(err));
      setStatus("");
    }
  }

  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <AdminTitle eyebrow={existing ? "Editar beat" : "Novo beat"} title={existing ? existing.title : "Subir beat"} />

      <section className="panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <Field label="Título" hint={existing ? `Endereço: /beats/${existing.slug}` : undefined}>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className="field" />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Catálogo" hint={catalogs.length === 0 ? "Crie um catálogo na aba Catálogos para organizar seus beats." : undefined}>
            <select value={catalogId} onChange={(e) => setCatalogId(e.target.value)} className="field">
              <option value="">{catalogs.length ? "Escolha um catálogo…" : "Sem catálogo"}</option>
              {catalogs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="BPM">
          <input required type="number" min={40} max={300} value={bpm} onChange={(e) => setBpm(e.target.value)} className="field" />
        </Field>
        <Field label="Tom" hint="Ex: Lá menor, F# minor">
          <input value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="field" />
        </Field>
        <Field label="Gênero" hint="Ex: Trap, Drill, Boom Bap, R&B">
          <input required value={genre} onChange={(e) => setGenre(e.target.value)} className="field" />
        </Field>
        <Field label="Moods" hint="Separe por vírgula: Sombrio, Chill">
          <input value={moods} onChange={(e) => setMoods(e.target.value)} className="field" />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tags" hint="Separe por vírgula: trap, 808, dark">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className="field" />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <p className="label">Arquivos</p>
        {FILE_FIELDS.map((field) => (
          <FileSlot
            key={field.column}
            field={field}
            current={(existing?.[field.column as keyof Existing] as string | null) ?? null}
            change={changes[field.column]}
            disabled={!!status}
            onChange={(c) => {
              setChanges((prev) => ({ ...prev, [field.column]: c }));
              if (field.column === "preview_url" && c?.file) void audioDuration(c.file).then(setDuration);
            }}
          />
        ))}
      </section>

      <section className="panel grid gap-4 p-5 sm:p-6">
        <Toggle checked={published} onChange={setPublished} label="Publicado (aparece na loja)" />
        <Toggle checked={freeDownload} onChange={setFreeDownload} label="Download grátis da prévia (com tag)" />
      </section>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={!!status}>
          {status || "Salvar beat"}
        </Button>
        <Link href="/admin" className={`btn btn-ghost ${status ? "pointer-events-none opacity-45" : ""}`}>
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function EditBeatForm() {
  const { id } = useParams<{ id: string }>();
  return <BeatForm key={id} beatId={id} />;
}

"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { refreshCatalog } from "@/app/actions";
import {
  MAX_UPLOAD_BYTES,
  pathFromPublicUrl,
  publicUrl,
  removeFiles,
  slugify,
  uploadFile,
} from "@/lib/admin-storage";
import { getSupabase } from "@/lib/supabase-browser";
import { Button, Field, inputClass } from "./ui";

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
  cover_url: string | null;
  preview_url: string;
  mp3_path: string | null;
  wav_path: string | null;
  stems_path: string | null;
};

type FileKey = "cover" | "preview" | "mp3" | "wav" | "stems";

const FILE_FIELDS: { key: FileKey; label: string; accept: string; hint: string }[] = [
  { key: "preview", label: "Prévia (com tag de voz)", accept: "audio/mpeg,.mp3", hint: "MP3 público que toca no site." },
  { key: "cover", label: "Capa", accept: "image/*", hint: "Imagem quadrada (ex: 1000×1000). Opcional." },
  { key: "mp3", label: "MP3 sem tag", accept: "audio/mpeg,.mp3", hint: "Entregue na licença Básica." },
  { key: "wav", label: "WAV", accept: "audio/wav,.wav", hint: "Entregue na Premium em diante." },
  { key: "stems", label: "Stems (.zip)", accept: ".zip,application/zip", hint: "Entregue na Trackout/Exclusiva." },
];

const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

export function BeatForm({ beatId }: { beatId?: string }) {
  const router = useRouter();
  const [existing, setExisting] = useState<Existing | null>(null);
  const [loading, setLoading] = useState(!!beatId);
  const [title, setTitle] = useState("");
  const [bpm, setBpm] = useState("");
  const [musicalKey, setMusicalKey] = useState("");
  const [genre, setGenre] = useState("");
  const [moods, setMoods] = useState("");
  const [tags, setTags] = useState("");
  const [published, setPublished] = useState(true);
  const [files, setFiles] = useState<Partial<Record<FileKey, File>>>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
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
        setPublished(data.published);
      });
  }, [beatId]);

  const currentFile: Record<FileKey, string | null> = {
    cover: existing?.cover_url ?? null,
    preview: existing?.preview_url ?? null,
    mp3: existing?.mp3_path ?? null,
    wav: existing?.wav_path ?? null,
    stems: existing?.stems_path ?? null,
  };

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const tooBig = Object.values(files).find((f) => f.size > MAX_UPLOAD_BYTES);
    if (tooBig) return setError(`"${tooBig.name}" passa de 50 MB (limite do plano grátis do Supabase).`);
    if (!existing && !files.preview) return setError("Envie a prévia em MP3.");

    const slug = existing?.slug ?? slugify(title);
    if (!slug) return setError("Dê um título ao beat.");

    try {
      const uploaded: Partial<Record<FileKey, string>> = {};
      for (const { key, label } of FILE_FIELDS) {
        const file = files[key];
        if (!file) continue;
        setStatus(`Enviando ${label.toLowerCase()}…`);
        const bucket = key === "cover" ? "covers" : key === "preview" ? "previews" : "masters";
        uploaded[key] = await uploadFile(bucket, slug, key, file);
      }

      setStatus("Salvando…");
      const row = {
        slug,
        title: title.trim(),
        bpm: Number(bpm),
        musical_key: musicalKey.trim() || null,
        genre: genre.trim(),
        moods: splitList(moods),
        tags: splitList(tags).map((t) => t.replace(/^#/, "").toLowerCase()),
        published,
        ...(uploaded.cover && { cover_url: publicUrl("covers", uploaded.cover) }),
        ...(uploaded.preview && { preview_url: publicUrl("previews", uploaded.preview) }),
        ...(uploaded.mp3 && { mp3_path: uploaded.mp3 }),
        ...(uploaded.wav && { wav_path: uploaded.wav }),
        ...(uploaded.stems && { stems_path: uploaded.stems }),
      };

      const { error } = existing
        ? await getSupabase().from("beats").update(row).eq("id", existing.id)
        : await getSupabase().from("beats").insert(row);
      if (error) {
        throw new Error(
          error.code === "23505" ? "Já existe um beat com esse nome. Escolha outro título." : error.message,
        );
      }

      // Arquivos antigos que foram substituídos.
      if (existing) {
        await Promise.all([
          uploaded.cover && removeFiles("covers", [pathFromPublicUrl("covers", existing.cover_url)]),
          uploaded.preview && removeFiles("previews", [pathFromPublicUrl("previews", existing.preview_url)]),
          removeFiles("masters", [
            uploaded.mp3 ? existing.mp3_path : null,
            uploaded.wav ? existing.wav_path : null,
            uploaded.stems ? existing.stems_path : null,
          ]),
        ]);
      }

      await refreshCatalog();
      router.push("/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus("");
    }
  }

  if (loading) return <p className="text-zinc-400">Carregando…</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <h1 className="text-2xl font-bold">{existing ? `Editar “${existing.title}”` : "Novo beat"}</h1>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Field label="Título" hint={existing ? `Endereço: /beats/${existing.slug}` : undefined}>
            <input required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
          </Field>
        </div>
        <Field label="BPM">
          <input
            required
            type="number"
            min={40}
            max={300}
            value={bpm}
            onChange={(e) => setBpm(e.target.value)}
            className={inputClass}
          />
        </Field>
        <Field label="Tom" hint="Ex: Lá menor, F# minor">
          <input value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Gênero" hint="Ex: Trap, Drill, Boom Bap, R&B">
          <input required value={genre} onChange={(e) => setGenre(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Moods" hint="Separe por vírgula: Sombrio, Chill">
          <input value={moods} onChange={(e) => setMoods(e.target.value)} className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Tags" hint="Separe por vírgula: trap, 808, dark">
            <input value={tags} onChange={(e) => setTags(e.target.value)} className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Arquivos</h2>
        {FILE_FIELDS.map(({ key, label, accept, hint }) => (
          <div key={key} className="rounded-xl border border-white/10 p-4">
            <Field
              label={label}
              hint={currentFile[key] ? `${hint} Já enviado — escolha outro para substituir.` : hint}
            >
              <input
                type="file"
                accept={accept}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setFiles((f) => ({ ...f, [key]: file }));
                }}
                className="block w-full text-sm text-zinc-400 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-white/15"
              />
            </Field>
          </div>
        ))}
      </section>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} />
        Publicado (aparece na loja)
      </label>

      {error && <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={!!status}>
          {status || "Salvar beat"}
        </Button>
        <Button variant="ghost" onClick={() => router.push("/admin")} disabled={!!status}>
          Cancelar
        </Button>
      </div>
    </form>
  );
}

export function EditBeatForm() {
  const { id } = useParams<{ id: string }>();
  return <BeatForm key={id} beatId={id} />;
}

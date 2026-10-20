"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  type Bucket,
  displayName,
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

type FileField = { key: FileKey; bucket: Bucket; label: string; accept: string; hint: string; required?: boolean };

const FILE_FIELDS: FileField[] = [
  { key: "preview", bucket: "previews", label: "Prévia (com tag de voz)", accept: "audio/mpeg,.mp3", hint: "MP3 público que toca no site.", required: true },
  { key: "cover", bucket: "covers", label: "Capa", accept: "image/*", hint: "Imagem quadrada (ex: 1000×1000). Opcional." },
  { key: "mp3", bucket: "masters", label: "MP3 sem tag", accept: "audio/mpeg,.mp3", hint: "Entregue na licença Básica." },
  { key: "wav", bucket: "masters", label: "WAV", accept: "audio/wav,.wav", hint: "Entregue na Premium em diante." },
  { key: "stems", bucket: "masters", label: "Stems (.zip)", accept: ".zip,application/zip", hint: "Entregue na Trackout/Exclusiva." },
];

// Coluna do banco onde cada arquivo fica salvo.
const COLUMN: Record<FileKey, "cover_url" | "preview_url" | "mp3_path" | "wav_path" | "stems_path"> = {
  cover: "cover_url",
  preview: "preview_url",
  mp3: "mp3_path",
  wav: "wav_path",
  stems: "stems_path",
};

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
  const [removed, setRemoved] = useState<Partial<Record<FileKey, boolean>>>({});
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

  /** Caminho do arquivo salvo no bucket (as colunas públicas guardam a URL). */
  function storedPath({ key, bucket }: FileField) {
    const value = existing?.[COLUMN[key]] ?? null;
    return bucket === "masters" ? value : pathFromPublicUrl(bucket, value);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const missingRequired = FILE_FIELDS.find(
      (f) => f.required && !files[f.key] && (!existing || removed[f.key]),
    );
    if (missingRequired) return setError(`${missingRequired.label} é obrigatória.`);

    const slug = existing?.slug ?? slugify(title);
    if (!slug) return setError("Dê um título ao beat.");

    const uploaded: Partial<Record<FileKey, string>> = {};
    let saved = false;
    try {
      for (const { key, bucket, label } of FILE_FIELDS) {
        const file = files[key];
        if (!file) continue;
        const name = label.toLowerCase();
        setStatus(`Enviando ${name}…`);
        uploaded[key] = await uploadFile(bucket, slug, key, file, (p) =>
          setStatus(`Enviando ${name}… ${Math.floor(p * 100)}%`),
        );
      }

      setStatus("Salvando…");
      const fileColumns: Record<string, string | null> = {};
      for (const { key, bucket } of FILE_FIELDS) {
        if (uploaded[key]) {
          fileColumns[COLUMN[key]] = bucket === "masters" ? uploaded[key] : publicUrl(bucket, uploaded[key]);
        } else if (removed[key]) {
          fileColumns[COLUMN[key]] = null;
        }
      }

      const row = {
        slug,
        title: title.trim(),
        bpm: Number(bpm),
        musical_key: musicalKey.trim() || null,
        genre: genre.trim(),
        moods: splitList(moods),
        tags: splitList(tags).map((t) => t.replace(/^#/, "").toLowerCase()),
        published,
        ...fileColumns,
      };

      const { error } = existing
        ? await getSupabase().from("beats").update(row).eq("id", existing.id)
        : await getSupabase().from("beats").insert(row);
      if (error) {
        throw new Error(
          error.code === "23505" ? "Já existe um beat com esse nome. Escolha outro título." : error.message,
        );
      }
      saved = true;

      // Apaga do armazenamento os arquivos antigos que foram substituídos ou removidos.
      if (existing) {
        await Promise.all(
          FILE_FIELDS.filter(({ key }) => uploaded[key] || removed[key]).map((field) =>
            removeFiles(field.bucket, [storedPath(field)]),
          ),
        );
      }

      router.push("/admin");
    } catch (err) {
      // Não deixa arquivo órfão se o banco não chegou a salvar.
      if (!saved) {
        await Promise.all(
          FILE_FIELDS.filter(({ key }) => uploaded[key]).map(({ key, bucket }) =>
            removeFiles(bucket, [uploaded[key]!]),
          ),
        );
      }
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
        {FILE_FIELDS.map((field) => (
          <FileSlot
            key={field.key}
            field={field}
            current={existing?.[COLUMN[field.key]] ?? null}
            selected={files[field.key]}
            removed={!!removed[field.key]}
            disabled={!!status}
            onSelect={(file) => {
              setFiles((f) => ({ ...f, [field.key]: file }));
              setRemoved((r) => ({ ...r, [field.key]: false }));
            }}
            onClear={() => setFiles((f) => ({ ...f, [field.key]: undefined }))}
            onRemove={(value) => setRemoved((r) => ({ ...r, [field.key]: value }))}
          />
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

function FileSlot({
  field,
  current,
  selected,
  removed,
  disabled,
  onSelect,
  onClear,
  onRemove,
}: {
  field: FileField;
  current: string | null;
  selected: File | undefined;
  removed: boolean;
  disabled: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
  onRemove: (removed: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hasCurrent = !!current && !removed;
  const canRemove = hasCurrent && !selected && !field.required;

  let state: React.ReactNode;
  if (selected) {
    state = (
      <>
        <span className="text-accent">Novo:</span> {selected.name}
        <span className="text-zinc-500">
          {" "}
          · {(selected.size / 1024 / 1024).toFixed(1)} MB · {current ? "vai substituir o atual" : "será enviado"} ao salvar
        </span>
      </>
    );
  } else if (removed) {
    state = <span className="text-red-300">Será removido ao salvar</span>;
  } else if (current) {
    state = (
      <>
        <span className="text-zinc-400">Atual:</span>{" "}
        {field.bucket === "masters" ? (
          displayName(current)
        ) : (
          <a href={current} target="_blank" rel="noreferrer" className="underline hover:text-accent">
            {displayName(current)}
          </a>
        )}
      </>
    );
  } else {
    state = <span className="text-zinc-500">Nenhum arquivo</span>;
  }

  return (
    <div className="rounded-xl border border-white/10 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium">
            {field.label}
            {field.required && <span className="text-accent"> *</span>}
          </p>
          <p className="text-xs text-zinc-500">{field.hint}</p>
          <p className="mt-2 truncate text-sm">{state}</p>
        </div>
        <div className="flex shrink-0 gap-2">
          {selected || removed ? (
            <Button variant="ghost" disabled={disabled} onClick={() => (selected ? onClear() : onRemove(false))}>
              Desfazer
            </Button>
          ) : (
            <Button variant="ghost" disabled={disabled} onClick={() => inputRef.current?.click()}>
              {current ? "Substituir" : "Escolher arquivo"}
            </Button>
          )}
          {canRemove && (
            <Button variant="danger" disabled={disabled} onClick={() => onRemove(true)}>
              Remover
            </Button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={field.accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = ""; // permite escolher o mesmo arquivo de novo
        }}
      />
    </div>
  );
}

export function EditBeatForm() {
  const { id } = useParams<{ id: string }>();
  return <BeatForm key={id} beatId={id} />;
}

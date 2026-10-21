"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Cover } from "@/components/cover";
import { pathFromPublicUrl, removeFiles, slugify } from "@/lib/admin-storage";
import { formatPrice } from "@/lib/format";
import { getSupabase } from "@/lib/supabase-browser";
import { type FileChanges, type FileField, FileSlot, missingRequired, uploadChanges } from "./file-slot";
import { AdminTitle, Button, centsToInput, ErrorBox, Field, parsePrice, splitList, Toggle } from "./ui";

type KitRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  tags: string[];
  cover_url: string | null;
  preview_url: string | null;
  file_path: string | null;
  price_cents: number;
  compare_at_cents: number | null;
  published: boolean;
};

const FILE_FIELDS: FileField[] = [
  { column: "file_path", bucket: "masters", label: "Pack (.zip)", accept: ".zip,application/zip", hint: "One-shots de bateria e melodias em WAV. Entregue ao comprador.", required: true },
  { column: "cover_url", bucket: "covers", label: "Capa", accept: "image/*", hint: "Imagem quadrada." },
  { column: "preview_url", bucket: "previews", label: "Prévia em áudio (opcional)", accept: "audio/mpeg,.mp3", hint: "Uma demonstração do que tem no pack." },
];

export function KitList() {
  const [rows, setRows] = useState<KitRow[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await getSupabase().from("soundkits").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as KitRow[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void load();
  }, [load]);

  async function remove(row: KitRow) {
    if (!confirm(`Apagar o pack "${row.title}" e os arquivos dele?`)) return;
    const { error } = await getSupabase().from("soundkits").delete().eq("id", row.id);
    if (error) return setError(error.message);
    await Promise.all([
      removeFiles("covers", [pathFromPublicUrl("covers", row.cover_url)]),
      removeFiles("previews", [pathFromPublicUrl("previews", row.preview_url)]),
      removeFiles("masters", [row.file_path]),
    ]);
    await load();
  }

  return (
    <div>
      <AdminTitle eyebrow="Sound kits" title="Packs" action={{ href: "/admin/packs/novo", label: "+ Novo pack" }} />
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows === null ? (
        <p className="text-muted">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="panel py-12 text-center text-muted">Nenhum pack ainda.</p>
      ) : (
        <ul className="panel divide-y divide-line">
          {rows.map((k) => (
            <li key={k.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
              <Cover src={k.cover_url} seed={k.slug} label={k.title} className="size-12 rounded-lg" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold uppercase">{k.title}</p>
                <p className="label mt-0.5 !text-[0.58rem]">
                  {formatPrice(k.price_cents)} · {k.published ? "Publicado" : "Oculto"} · {k.file_path ? "zip ok" : "sem zip"}
                </p>
              </div>
              <div className="flex gap-2">
                <Link href={`/admin/packs/${k.id}`} className="btn btn-ghost !px-3 !py-2">
                  Editar
                </Link>
                <Button variant="danger" onClick={() => remove(k)} className="!px-3 !py-2">
                  Apagar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function KitForm({ kitId }: { kitId?: string }) {
  const router = useRouter();
  const [existing, setExisting] = useState<KitRow | null>(null);
  const [loading, setLoading] = useState(!!kitId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState("");
  const [price, setPrice] = useState("");
  const [compareAt, setCompareAt] = useState("");
  const [published, setPublished] = useState(true);
  const [changes, setChanges] = useState<FileChanges>({});
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!kitId) return;
    getSupabase()
      .from("soundkits")
      .select("*")
      .eq("id", kitId)
      .single<KitRow>()
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return setError("Pack não encontrado.");
        setExisting(data);
        setTitle(data.title);
        setDescription(data.description ?? "");
        setTags(data.tags.join(", "));
        setPrice(centsToInput(data.price_cents));
        setCompareAt(centsToInput(data.compare_at_cents));
        setPublished(data.published);
      });
  }, [kitId]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const priceCents = parsePrice(price);
    if (priceCents == null) return setError("Preço inválido.");
    const compareCents = compareAt.trim() ? parsePrice(compareAt) : null;
    if (compareAt.trim() && compareCents == null) return setError("Preço “de” inválido.");
    const missing = missingRequired(FILE_FIELDS, changes, existing);
    if (missing) return setError(`${missing.label} é obrigatório.`);

    const slug = existing?.slug ?? slugify(title);
    if (!slug) return setError("Dê um nome ao pack.");

    let rollback: (() => Promise<unknown>) | null = null;
    try {
      const files = await uploadChanges(FILE_FIELDS, changes, existing, `kits/${slug}`, setStatus);
      rollback = files.rollback;
      setStatus("Salvando…");
      const row = {
        slug,
        title: title.trim(),
        description: description.trim() || null,
        tags: splitList(tags),
        price_cents: priceCents,
        compare_at_cents: compareCents,
        published,
        ...files.columns,
      };
      const { error } = existing
        ? await getSupabase().from("soundkits").update(row).eq("id", existing.id)
        : await getSupabase().from("soundkits").insert(row);
      if (error) throw new Error(error.code === "23505" ? "Já existe um pack com esse nome." : error.message);
      rollback = null;
      await files.cleanupOld();
      router.push("/admin/packs");
    } catch (err) {
      await rollback?.();
      setError(err instanceof Error ? err.message : String(err));
      setStatus("");
    }
  }

  if (loading) return <p className="text-muted">Carregando…</p>;

  return (
    <form onSubmit={save} className="max-w-3xl space-y-8">
      <AdminTitle eyebrow={existing ? "Editar pack" : "Novo pack"} title={existing ? existing.title : "Subir sound kit"} />
      <section className="panel grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <Field label="Nome" hint={existing ? `Endereço: /packs/${existing.slug}` : undefined}>
            <input required className="field" value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
        </div>
        <Field label="Preço (R$)" hint="Preço único, sem licença.">
          <input required inputMode="decimal" className="field" placeholder="49,90" value={price} onChange={(e) => setPrice(e.target.value)} />
        </Field>
        <Field label="Preço “de” (opcional)" hint="Aparece riscado, para promoções.">
          <input inputMode="decimal" className="field" placeholder="99,90" value={compareAt} onChange={(e) => setCompareAt(e.target.value)} />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Descrição" hint="O que vem no pack: quantos one-shots, loops, estilos…">
            <textarea rows={5} className="field" value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Tags" hint="Separe por vírgula: drums, trap, one-shots">
            <input className="field" value={tags} onChange={(e) => setTags(e.target.value)} />
          </Field>
        </div>
      </section>

      <section className="space-y-3">
        <p className="label">Arquivos</p>
        {FILE_FIELDS.map((f) => (
          <FileSlot
            key={f.column}
            field={f}
            current={(existing?.[f.column as keyof KitRow] as string | null) ?? null}
            change={changes[f.column]}
            disabled={!!status}
            onChange={(c) => setChanges((p) => ({ ...p, [f.column]: c }))}
          />
        ))}
      </section>

      <section className="panel p-5">
        <Toggle checked={published} onChange={setPublished} label="Publicado (aparece na loja)" />
      </section>

      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={!!status}>
          {status || "Salvar pack"}
        </Button>
        <Link href="/admin/packs" className="btn btn-ghost">
          Cancelar
        </Link>
      </div>
    </form>
  );
}

export function EditKitForm() {
  const { id } = useParams<{ id: string }>();
  return <KitForm key={id} kitId={id} />;
}

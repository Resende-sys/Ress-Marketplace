"use client";

import { useEffect, useMemo, useRef } from "react";
import { type Bucket, displayName, pathFromPublicUrl, publicUrl, removeFiles, uploadFile } from "@/lib/admin-storage";
import { Button } from "./ui";

export type FileField = {
  /** Coluna do banco onde o arquivo fica salvo. */
  column: string;
  bucket: Bucket;
  label: string;
  accept: string;
  hint: string;
  required?: boolean;
};

export type FileChanges = Record<string, { file?: File; removed?: boolean } | undefined>;

/**
 * Envia os arquivos escolhidos e devolve as colunas a gravar no banco.
 * `cleanupOld` apaga os arquivos substituídos/removidos (chamar depois de salvar);
 * `rollback` apaga os recém-enviados (chamar se o salvamento falhar).
 */
export async function uploadChanges(
  fields: FileField[],
  changes: FileChanges,
  current: Record<string, unknown> | null,
  folder: string,
  onStatus: (s: string) => void,
) {
  const uploaded: { bucket: Bucket; key: string }[] = [];
  const columns: Record<string, string | null> = {};
  const old: { bucket: Bucket; key: string | null }[] = [];

  const storedKey = (f: FileField) => {
    const v = (current?.[f.column] as string | null) ?? null;
    return f.bucket === "masters" ? v : pathFromPublicUrl(f.bucket, v);
  };

  const rollback = () => Promise.all(uploaded.map((u) => removeFiles(u.bucket, [u.key])));

  try {
    for (const f of fields) {
      const change = changes[f.column];
      if (change?.file) {
        const name = f.label.toLowerCase();
        onStatus(`Enviando ${name}…`);
        const key = await uploadFile(f.bucket, folder, f.column.replace(/_(url|path)$/, "").replace(/_/g, "-"), change.file, (p) =>
          onStatus(`Enviando ${name}… ${Math.floor(p * 100)}%`),
        );
        uploaded.push({ bucket: f.bucket, key });
        columns[f.column] = f.bucket === "masters" ? key : publicUrl(f.bucket, key);
        old.push({ bucket: f.bucket, key: storedKey(f) });
      } else if (change?.removed) {
        columns[f.column] = null;
        old.push({ bucket: f.bucket, key: storedKey(f) });
      }
    }
  } catch (err) {
    await rollback();
    throw err;
  }

  return {
    columns,
    rollback,
    cleanupOld: () => Promise.all(old.map((o) => removeFiles(o.bucket, [o.key]))),
  };
}

export function missingRequired(fields: FileField[], changes: FileChanges, current: Record<string, unknown> | null) {
  return fields.find((f) => f.required && !changes[f.column]?.file && (!current?.[f.column] || changes[f.column]?.removed));
}

/** Um campo de arquivo com Substituir / Remover / Desfazer. */
export function FileSlot({
  field,
  current,
  change,
  disabled,
  onChange,
}: {
  field: FileField;
  current: string | null;
  change: { file?: File; removed?: boolean } | undefined;
  disabled: boolean;
  onChange: (c: { file?: File; removed?: boolean } | undefined) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const selected = change?.file;
  const removed = change?.removed;
  const canRemove = !!current && !removed && !selected && !field.required;
  const isImage = field.accept.startsWith("image");

  let state: React.ReactNode;
  if (selected) {
    state = (
      <>
        <span className="text-accent-hi">Novo:</span> {selected.name}
        <span className="text-dim"> · {(selected.size / 1024 / 1024).toFixed(1)} MB · {current ? "substitui o atual" : "será enviado"} ao salvar</span>
      </>
    );
  } else if (removed) {
    state = <span className="text-accent-hi">Será removido ao salvar</span>;
  } else if (current) {
    state = (
      <>
        <span className="text-muted">Atual:</span>{" "}
        {field.bucket === "masters" ? (
          displayName(current)
        ) : (
          <a href={current} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-accent-hi">
            {displayName(current)}
          </a>
        )}
      </>
    );
  } else {
    state = <span className="text-dim">Nenhum arquivo</span>;
  }

  const localPreview = useMemo(() => (selected && isImage ? URL.createObjectURL(selected) : null), [selected, isImage]);
  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);
  const preview = localPreview ?? (!removed && isImage ? current : null);

  return (
    <div className="rounded-xl border border-line bg-black/20 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          {isImage && (
            <div className="size-14 shrink-0 overflow-hidden rounded-lg border border-line bg-white/5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {preview && <img src={preview} alt="" className="size-full object-cover" />}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-accent-hi"> *</span>}
            </p>
            <p className="text-xs text-dim">{field.hint}</p>
            <p className="mt-2 truncate text-sm">{state}</p>
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          {selected || removed ? (
            <Button variant="ghost" disabled={disabled} onClick={() => onChange(undefined)} className="!px-3 !py-2">
              Desfazer
            </Button>
          ) : (
            <Button variant="ghost" disabled={disabled} onClick={() => inputRef.current?.click()} className="!px-3 !py-2">
              {current ? "Substituir" : "Escolher"}
            </Button>
          )}
          {canRemove && (
            <Button variant="danger" disabled={disabled} onClick={() => onChange({ removed: true })} className="!px-3 !py-2">
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
          if (file) onChange({ file });
          e.target.value = "";
        }}
      />
    </div>
  );
}

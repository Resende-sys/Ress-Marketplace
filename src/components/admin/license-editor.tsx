"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { AdminTitle, Button, centsToInput, ErrorBox, Field, parsePrice, splitList, Toggle } from "./ui";

type Row = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  files: string[];
  limits: string[];
  is_exclusive: boolean;
  featured: boolean;
};

export function LicenseEditor() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      .from("licenses")
      .select("id, name, description, price_cents, files, limits, is_exclusive, featured")
      .order("sort_order")
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data as Row[])));
  }, []);

  return (
    <div>
      <AdminTitle eyebrow="Valem para todos os beats" title="Licenças" />
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows === null ? (
        <p className="text-muted">Carregando…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {rows.map((row) => (
            <LicenseCard key={row.id} row={row} />
          ))}
        </div>
      )}
    </div>
  );
}

function LicenseCard({ row }: { row: Row }) {
  const [name, setName] = useState(row.name);
  const [description, setDescription] = useState(row.description ?? "");
  const [price, setPrice] = useState(centsToInput(row.price_cents));
  const [files, setFiles] = useState(row.files.join(", "));
  const [limits, setLimits] = useState(row.limits.join("\n"));
  const [featured, setFeatured] = useState(row.featured);
  const [status, setStatus] = useState<"" | "saving" | "saved" | string>("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = parsePrice(price);
    if (cents == null) return setStatus("Preço inválido.");
    setStatus("saving");
    const { error } = await getSupabase()
      .from("licenses")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        price_cents: cents,
        files: splitList(files),
        limits: limits.split("\n").map((l) => l.trim()).filter(Boolean),
        featured,
      })
      .eq("id", row.id);
    setStatus(error ? error.message : "saved");
  }

  return (
    <form onSubmit={save} className={`panel space-y-4 p-5 sm:p-6 ${featured ? "hud border-accent/50" : ""}`}>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome">
          <input required value={name} onChange={(e) => setName(e.target.value)} className="field" />
        </Field>
        <Field label="Preço (R$)" hint={row.is_exclusive ? "Exclusiva aparece como “Sob consulta”." : undefined}>
          <input required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className="field" />
        </Field>
      </div>
      <Field label="Descrição">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="field" />
      </Field>
      <Field label="Arquivos entregues" hint="Separe por vírgula: MP3, WAV, Stems">
        <input value={files} onChange={(e) => setFiles(e.target.value)} className="field" />
      </Field>
      <Field label="Limites / termos de uso" hint="Um por linha. Aparecem na escolha da licença.">
        <textarea rows={4} value={limits} onChange={(e) => setLimits(e.target.value)} className="field" />
      </Field>
      <Toggle checked={featured} onChange={setFeatured} label="Destacar como “Mais popular”" />
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Salvando…" : "Salvar"}
        </Button>
        {status === "saved" && <span className="text-sm text-accent-hi">Salvo ✓</span>}
        {status && status !== "saving" && status !== "saved" && <span className="text-sm text-accent-hi">{status}</span>}
      </div>
    </form>
  );
}

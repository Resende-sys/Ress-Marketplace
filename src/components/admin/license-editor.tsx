"use client";

import { useEffect, useState } from "react";
import { refreshCatalog } from "@/app/actions";
import { getSupabase } from "@/lib/supabase-browser";
import { Button, Field, inputClass } from "./ui";

type Row = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  files: string[];
  limits: string[];
  is_exclusive: boolean;
};

export function LicenseEditor() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      .from("licenses")
      .select("id, name, description, price_cents, files, limits, is_exclusive")
      .order("sort_order")
      .then(({ data, error }) => (error ? setError(error.message) : setRows(data)));
  }, []);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Licenças</h1>
      <p className="mb-6 text-sm text-zinc-400">Os preços valem para todos os beats.</p>
      {error && <p className="mb-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      {rows === null ? (
        <p className="text-zinc-400">Carregando…</p>
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
  const [price, setPrice] = useState((row.price_cents / 100).toFixed(2).replace(".", ","));
  const [files, setFiles] = useState(row.files.join(", "));
  const [limits, setLimits] = useState(row.limits.join("\n"));
  const [status, setStatus] = useState<"" | "saving" | "saved" | string>("");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const cents = Math.round(Number(price.replace(/\./g, "").replace(",", ".")) * 100);
    if (!Number.isFinite(cents) || cents < 0) return setStatus("Preço inválido.");
    setStatus("saving");
    const { error } = await getSupabase()
      .from("licenses")
      .update({
        name: name.trim(),
        description: description.trim() || null,
        price_cents: cents,
        files: files.split(",").map((f) => f.trim()).filter(Boolean),
        limits: limits.split("\n").map((l) => l.trim()).filter(Boolean),
      })
      .eq("id", row.id);
    if (error) return setStatus(error.message);
    await refreshCatalog();
    setStatus("saved");
  }

  return (
    <form onSubmit={save} className="space-y-3 rounded-xl border border-white/10 p-5">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Nome">
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Preço (R$)" hint={row.is_exclusive ? "Exclusiva aparece como “Sob consulta”." : undefined}>
          <input
            required
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Descrição">
        <input value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Arquivos entregues" hint="Separe por vírgula: MP3, WAV, Stems">
        <input value={files} onChange={(e) => setFiles(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Limites / benefícios" hint="Um por linha">
        <textarea rows={3} value={limits} onChange={(e) => setLimits(e.target.value)} className={inputClass} />
      </Field>
      <div className="flex items-center gap-3">
        <Button type="submit" disabled={status === "saving"}>
          {status === "saving" ? "Salvando…" : "Salvar"}
        </Button>
        {status === "saved" && <span className="text-sm text-accent">Salvo ✓</span>}
        {status && status !== "saving" && status !== "saved" && (
          <span className="text-sm text-red-300">{status}</span>
        )}
      </div>
    </form>
  );
}

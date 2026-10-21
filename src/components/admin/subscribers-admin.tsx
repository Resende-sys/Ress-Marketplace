"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { AdminTitle, Button, ErrorBox } from "./ui";

type Row = { id: string; name: string | null; email: string; created_at: string };

export function SubscribersList() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const { data, error } = await getSupabase().from("subscribers").select("*").order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows(data as Row[]);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial
    void load();
  }, [load]);

  function exportCsv() {
    const csv = ["nome,email,data", ...(rows ?? []).map((r) => [r.name ?? "", r.email, r.created_at.slice(0, 10)].map((v) => `"${v.replace(/"/g, '""')}"`).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([`﻿${csv}`], { type: "text/csv;charset=utf-8" }));
    a.download = "lista-de-emails.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function remove(row: Row) {
    if (!confirm(`Remover ${row.email} da lista?`)) return;
    const { error } = await getSupabase().from("subscribers").delete().eq("id", row.id);
    if (error) return setError(error.message);
    await load();
  }

  return (
    <div>
      <AdminTitle eyebrow={rows ? `${rows.length} inscritos` : "Lista"} title="Lista de e-mails" />
      {error && <ErrorBox>{error}</ErrorBox>}
      {rows === null ? (
        <p className="text-muted">Carregando…</p>
      ) : rows.length === 0 ? (
        <p className="panel py-12 text-center text-muted">Ninguém na lista ainda. O formulário “Entre na lista” fica na página inicial e em Contato.</p>
      ) : (
        <>
          <Button variant="ghost" onClick={exportCsv} className="mb-4">
            Baixar planilha (.csv)
          </Button>
          <ul className="panel divide-y divide-line">
            {rows.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.name || "—"}</p>
                  <p className="truncate text-sm text-muted">{r.email}</p>
                </div>
                <span className="label !text-[0.6rem]">{new Date(r.created_at).toLocaleDateString("pt-BR")}</span>
                <Button variant="danger" onClick={() => remove(r)} className="!px-3 !py-2">
                  Remover
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

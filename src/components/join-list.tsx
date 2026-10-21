"use client";

import { useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { CheckIcon } from "./icons";

/** "Entre na lista": guarda nome + e-mail para avisos de lançamentos. */
export function JoinList() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    const { error } = await getSupabase()
      .from("subscribers")
      .insert({ name: name.trim() || null, email: email.trim().toLowerCase() });
    // 23505 = já estava na lista → para o visitante é sucesso também.
    setStatus(!error || error.code === "23505" ? "done" : "error");
  }

  return (
    <section className="panel hud relative overflow-hidden p-6 sm:p-10">
      <div className="pointer-events-none absolute -top-24 -right-24 size-72 rounded-full bg-accent/20 blur-3xl" />
      <div className="relative grid items-center gap-8 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <p className="label !text-accent-hi">Lista VIP</p>
          <h2 className="display mt-3 text-4xl font-bold sm:text-5xl">Entre na lista.</h2>
          <p className="mt-3 text-muted">Lançamentos, beats grátis e promoções antes de todo mundo.</p>
        </div>
        {status === "done" ? (
          <p className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/10 p-5 font-semibold">
            <CheckIcon className="size-5 text-accent-hi" /> Pronto! Você está na lista.
          </p>
        ) : (
          <form onSubmit={submit} className="grid gap-2 sm:grid-cols-[1fr_1.4fr_auto]">
            <input className="field" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} maxLength={120} autoComplete="name" />
            <input className="field" type="email" required placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
            <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Entrar"}
            </button>
            {status === "error" && <p className="text-sm text-accent-hi sm:col-span-3">Não deu certo. Confira o e-mail e tente de novo.</p>}
          </form>
        )}
      </div>
    </section>
  );
}

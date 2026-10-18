"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { Button, Field, inputClass } from "./ui";

type Status = "loading" | "signed-out" | "not-admin" | "admin";

export function AdminGate({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    const check = async (s: Session | null) => {
      setSession(s);
      if (!s) return setStatus("signed-out");
      const { data } = await supabase.from("admins").select("user_id").eq("user_id", s.user.id).maybeSingle();
      setStatus(data ? "admin" : "not-admin");
    };
    supabase.auth.getSession().then(({ data }) => check(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      // Evita chamar o banco dentro do callback de auth (recomendação do Supabase).
      setTimeout(() => check(s), 0);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  if (status === "loading") return <p className="text-zinc-400">Carregando…</p>;
  if (status === "signed-out") return <LoginForm />;
  if (status === "not-admin")
    return (
      <div className="mx-auto max-w-md space-y-4 text-center">
        <p>
          Você entrou como <strong>{session?.user.email}</strong>, mas essa conta não é admin.
        </p>
        <p className="text-sm text-zinc-400">
          Rode a última parte do <code>supabase/002_admin.sql</code> com este e-mail.
        </p>
        <Button variant="ghost" onClick={() => getSupabase().auth.signOut()}>
          Sair
        </Button>
      </div>
    );

  return (
    <div>
      <nav className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 border-b border-white/10 pb-4 text-sm">
        <span className="font-bold text-accent">Painel</span>
        <Link href="/admin" className="text-zinc-300 hover:text-white">
          Beats
        </Link>
        <Link href="/admin/licencas" className="text-zinc-300 hover:text-white">
          Licenças
        </Link>
        <Link href="/" className="text-zinc-300 hover:text-white">
          Ver site
        </Link>
        <span className="ml-auto text-zinc-500">{session?.user.email}</span>
        <button type="button" onClick={() => getSupabase().auth.signOut()} className="text-zinc-300 hover:text-white">
          Sair
        </button>
      </nav>
      {children}
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="mx-auto max-w-sm space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) setError("E-mail ou senha incorretos.");
        setBusy(false);
      }}
    >
      <h1 className="text-2xl font-bold">Entrar no painel</h1>
      <Field label="E-mail">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </Field>
      <Field label="Senha">
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </Field>
      {error && <p className="text-sm text-red-400">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full">
        {busy ? "Entrando…" : "Entrar"}
      </Button>
    </form>
  );
}

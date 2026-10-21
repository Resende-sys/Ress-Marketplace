"use client";

import type { Session } from "@supabase/supabase-js";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { Button, Field } from "./ui";

type Status = "loading" | "signed-out" | "not-admin" | "admin";

const NAV = [
  { href: "/admin", label: "Beats" },
  { href: "/admin/catalogos", label: "Catálogos" },
  { href: "/admin/packs", label: "Packs" },
  { href: "/admin/licencas", label: "Licenças" },
  { href: "/admin/sobre", label: "Sobre" },
  { href: "/admin/lista", label: "Lista" },
];

export function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
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

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" || pathname.startsWith("/admin/beats") : pathname.startsWith(href));

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="display flex items-center gap-2 text-lg font-bold">
            <span className="inline-block size-2 rotate-45 bg-accent shadow-[0_0_12px_var(--glow)]" />
            Painel
          </Link>
          <div className="flex items-center gap-2">
            {status === "admin" && <span className="label hidden !text-[0.6rem] sm:inline">{session?.user.email}</span>}
            <Link href="/" className="btn btn-ghost !px-3 !py-2">
              Ver site
            </Link>
            {status !== "signed-out" && status !== "loading" && (
              <button type="button" onClick={() => getSupabase().auth.signOut()} className="btn btn-ghost !px-3 !py-2">
                Sair
              </button>
            )}
          </div>
        </div>
        {status === "admin" && (
          <nav className="mx-auto max-w-6xl overflow-x-auto px-2 sm:px-4">
            <div className="flex w-max gap-1 pb-2">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className={`rounded-lg px-3.5 py-2 font-mono text-[0.66rem] tracking-[0.18em] uppercase transition ${
                    isActive(n.href) ? "bg-accent text-white shadow-[0_6px_20px_-8px_var(--glow)]" : "text-muted hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        {status === "loading" && <p className="text-muted">Carregando…</p>}
        {status === "signed-out" && <LoginForm />}
        {status === "not-admin" && (
          <div className="panel mx-auto max-w-md space-y-4 p-8 text-center">
            <p>
              Você entrou como <strong>{session?.user.email}</strong>, mas essa conta não é admin.
            </p>
            <p className="text-sm text-muted">
              Rode a última parte do <code>supabase/002_admin.sql</code> com este e-mail.
            </p>
            <Button variant="ghost" onClick={() => getSupabase().auth.signOut()}>
              Sair
            </Button>
          </div>
        )}
        {status === "admin" && children}
      </main>
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
      className="panel hud mx-auto mt-10 max-w-sm space-y-5 p-7"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        const { error } = await getSupabase().auth.signInWithPassword({ email, password });
        if (error) setError("E-mail ou senha incorretos.");
        setBusy(false);
      }}
    >
      <div>
        <p className="label !text-accent-hi">Acesso restrito</p>
        <h1 className="display mt-2 text-3xl font-bold">Entrar no painel</h1>
      </div>
      <Field label="E-mail">
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="field" autoComplete="email" />
      </Field>
      <Field label="Senha">
        <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="field" autoComplete="current-password" />
      </Field>
      {error && <p className="text-sm text-accent-hi">{error}</p>}
      <button type="submit" disabled={busy} className="btn btn-primary w-full !py-3.5">
        {busy ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}

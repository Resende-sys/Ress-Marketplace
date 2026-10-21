"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase-browser";
import { type FileChanges, type FileField, FileSlot, uploadChanges } from "./file-slot";
import { AdminTitle, Button, ErrorBox, Field } from "./ui";

type Settings = {
  brand_name: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  photo_url: string | null;
  email: string | null;
  whatsapp: string | null;
  instagram: string | null;
  youtube: string | null;
  tiktok: string | null;
  spotify: string | null;
  soundcloud: string | null;
  beatstars: string | null;
  announcement_text: string | null;
  announcement_url: string | null;
  artists: string[];
};

type TextKey = Exclude<keyof Settings, "artists" | "photo_url">;

const PHOTO: FileField = { column: "photo_url", bucket: "covers", label: "Sua foto", accept: "image/*", hint: "Aparece na página Sobre (formato retrato fica melhor)." };

const GROUPS: { title: string; fields: { key: TextKey; label: string; hint?: string; textarea?: boolean; placeholder?: string }[] }[] = [
  {
    title: "Marca e página inicial",
    fields: [
      { key: "brand_name", label: "Nome da marca", placeholder: "RESS Beats" },
      { key: "hero_title", label: "Título da página inicial", hint: "A frase grande do topo.", placeholder: "Som que move" },
      { key: "hero_subtitle", label: "Subtítulo", placeholder: "Beats originais com licença na hora." },
    ],
  },
  {
    title: "Faixa de aviso (topo do site)",
    fields: [
      { key: "announcement_text", label: "Texto", hint: "Deixe vazio para esconder a faixa.", placeholder: "NOVO CATÁLOGO NO AR — OUÇA AGORA" },
      { key: "announcement_url", label: "Link (opcional)", placeholder: "/catalogos/nome-do-catalogo" },
    ],
  },
  {
    title: "Apresentação",
    fields: [{ key: "about_text", label: "Texto sobre você", hint: "Sua história, estilo, conquistas.", textarea: true }],
  },
  {
    title: "Contato",
    fields: [
      { key: "email", label: "E-mail", placeholder: "contato@seudominio.com" },
      { key: "whatsapp", label: "WhatsApp", hint: "Com DDD. Ex: 11 99999-9999", placeholder: "11 99999-9999" },
    ],
  },
  {
    title: "Redes sociais",
    fields: [
      { key: "instagram", label: "Instagram", placeholder: "@seuperfil" },
      { key: "youtube", label: "YouTube", placeholder: "@seucanal" },
      { key: "tiktok", label: "TikTok", placeholder: "@seuperfil" },
      { key: "spotify", label: "Spotify", hint: "Cole o link do perfil.", placeholder: "https://open.spotify.com/artist/…" },
      { key: "soundcloud", label: "SoundCloud", placeholder: "seuperfil" },
      { key: "beatstars", label: "BeatStars", placeholder: "seuperfil" },
    ],
  },
];

export function SettingsForm() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [artistInput, setArtistInput] = useState("");
  const [changes, setChanges] = useState<FileChanges>({});
  const [status, setStatus] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getSupabase()
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle<Settings>()
      .then(({ data, error }) => {
        if (error) return setError(`${error.message} — rode o supabase/003_marketplace.sql.`);
        setSettings(data ?? ({ brand_name: "RESS Beats", artists: [] } as unknown as Settings));
      });
  }, []);

  if (!settings) return error ? <ErrorBox>{error}</ErrorBox> : <p className="text-muted">Carregando…</p>;

  const set = (key: keyof Settings, value: string | string[]) => {
    setSaved(false);
    setSettings((s) => (s ? { ...s, [key]: value } : s));
  };

  function addArtist() {
    const names = artistInput.split(",").map((a) => a.trim()).filter(Boolean);
    if (!names.length) return;
    set("artists", [...settings!.artists, ...names.filter((n) => !settings!.artists.includes(n))]);
    setArtistInput("");
  }

  function moveArtist(i: number, dir: -1 | 1) {
    const list = [...settings!.artists];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    set("artists", list);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    let rollback: (() => Promise<unknown>) | null = null;
    try {
      const files = await uploadChanges([PHOTO], changes, settings as unknown as Record<string, unknown>, "site", setStatus);
      rollback = files.rollback;
      setStatus("Salvando…");
      const clean = Object.fromEntries(
        Object.entries(settings!).map(([k, v]) => [k, typeof v === "string" ? v.trim() || null : v]),
      );
      const row = { ...clean, brand_name: (clean.brand_name as string | null) ?? "RESS Beats", ...files.columns, updated_at: new Date().toISOString() };
      delete (row as Record<string, unknown>).id;
      const { error } = await getSupabase().from("site_settings").update(row).eq("id", 1);
      if (error) throw new Error(error.message);
      rollback = null;
      await files.cleanupOld();
      setSettings((s) => (s ? { ...s, ...files.columns } : s));
      setChanges({});
      setSaved(true);
    } catch (err) {
      await rollback?.();
      setError(err instanceof Error ? err.message : String(err));
    }
    setStatus("");
  }

  return (
    <form onSubmit={save} className="max-w-3xl space-y-6">
      <AdminTitle eyebrow="Informações do site" title="Sobre & contato" />

      <FileSlot field={PHOTO} current={settings.photo_url} change={changes.photo_url} disabled={!!status} onChange={(c) => setChanges({ photo_url: c })} />

      {GROUPS.map((g) => (
        <section key={g.title} className="panel p-5 sm:p-6">
          <p className="label mb-4">{g.title}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map((f) => (
              <div key={f.key} className={f.textarea || g.fields.length === 1 ? "sm:col-span-2" : ""}>
                <Field label={f.label} hint={f.hint}>
                  {f.textarea ? (
                    <textarea rows={6} className="field" value={settings[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                  ) : (
                    <input className="field" placeholder={f.placeholder} value={settings[f.key] ?? ""} onChange={(e) => set(f.key, e.target.value)} />
                  )}
                </Field>
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="panel p-5 sm:p-6">
        <p className="label mb-1">Artistas com quem já trabalhei</p>
        <p className="mb-4 text-xs text-dim">Aparecem na faixa que corre na página inicial e na página Sobre.</p>
        <div className="flex gap-2">
          <input
            className="field"
            placeholder="Nome do artista (ou vários separados por vírgula)"
            value={artistInput}
            onChange={(e) => setArtistInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addArtist();
              }
            }}
          />
          <Button variant="ghost" onClick={addArtist}>
            Adicionar
          </Button>
        </div>
        {settings.artists.length > 0 && (
          <ul className="mt-4 space-y-1.5">
            {settings.artists.map((a, i) => (
              <li key={a} className="flex items-center gap-2 rounded-xl border border-line bg-black/20 px-3 py-2">
                <span className="font-mono text-xs text-accent-hi">{String(i + 1).padStart(2, "0")}</span>
                <span className="flex-1 truncate font-semibold uppercase">{a}</span>
                <button type="button" onClick={() => moveArtist(i, -1)} className="px-2 text-muted hover:text-white" aria-label="Subir">
                  ↑
                </button>
                <button type="button" onClick={() => moveArtist(i, 1)} className="px-2 text-muted hover:text-white" aria-label="Descer">
                  ↓
                </button>
                <button type="button" onClick={() => set("artists", settings.artists.filter((x) => x !== a))} className="px-2 text-accent-hi" aria-label={`Remover ${a}`}>
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {error && <ErrorBox>{error}</ErrorBox>}
      <div className="sticky bottom-4 z-10 flex items-center gap-3">
        <Button type="submit" disabled={!!status} className="shadow-[0_10px_40px_-10px_var(--glow)]">
          {status || "Salvar informações"}
        </Button>
        {saved && <span className="text-sm text-accent-hi">Salvo ✓ — já está no site.</span>}
      </div>
    </form>
  );
}

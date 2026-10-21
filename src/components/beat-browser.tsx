"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice, formatTime } from "@/lib/format";
import type { Beat } from "@/lib/types";
import { Cover } from "./cover";
import { CartIcon, DownloadIcon, PauseIcon, PlayIcon, SearchIcon, ShareIcon } from "./icons";
import { useLicensePicker } from "./license-picker";
import { usePlayer } from "./player";

export type BeatTab = "populares" | "lancamentos" | "todos";

const TABS: { id: BeatTab; label: string }[] = [
  { id: "populares", label: "Populares" },
  { id: "lancamentos", label: "Lançamentos" },
  { id: "todos", label: "Todos" },
];

function sortFor(tab: BeatTab, beats: Beat[]) {
  if (tab === "populares") {
    return [...beats].sort((a, b) => b.plays - a.plays || b.createdAt.localeCompare(a.createdAt));
  }
  if (tab === "lancamentos") return [...beats].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return [...beats].sort((a, b) => a.title.localeCompare(b.title, "pt-BR"));
}

/** Lista de beats com abas (Populares / Lançamentos / Todos) e filtros opcionais. */
export function BeatBrowser({
  beats,
  fromPriceCents,
  tabs = true,
  filters = true,
  limit,
  initialTab = "populares",
}: {
  beats: Beat[];
  fromPriceCents: number | null;
  tabs?: boolean;
  filters?: boolean;
  limit?: number;
  initialTab?: BeatTab;
}) {
  const [tab, setTab] = useState<BeatTab>(initialTab);
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");
  const [key, setKey] = useState("");
  const [bpmMin, setBpmMin] = useState("");
  const [bpmMax, setBpmMax] = useState("");

  const options = useMemo(
    () => ({
      genres: [...new Set(beats.map((b) => b.genre))].sort(),
      moods: [...new Set(beats.flatMap((b) => b.moods))].sort(),
      keys: [...new Set(beats.map((b) => b.musicalKey).filter((k): k is string => !!k))].sort(),
    }),
    [beats],
  );

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const min = Number(bpmMin) || 0;
    const max = Number(bpmMax) || Infinity;
    const filtered = beats.filter(
      (b) =>
        (!genre || b.genre === genre) &&
        (!mood || b.moods.includes(mood)) &&
        (!key || b.musicalKey === key) &&
        b.bpm >= min &&
        b.bpm <= max &&
        (!q || b.title.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q)) || String(b.bpm) === q),
    );
    const sorted = tabs ? sortFor(tab, filtered) : filtered;
    return limit ? sorted.slice(0, limit) : sorted;
  }, [beats, tab, tabs, query, genre, mood, key, bpmMin, bpmMax, limit]);

  return (
    <div>
      {(tabs || filters) && (
        <div className="mb-5 flex flex-col gap-3">
          {tabs && (
            <div role="tablist" className="flex w-full gap-1 rounded-2xl border border-line bg-surface p-1 sm:w-fit">
              {TABS.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  type="button"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex-1 rounded-xl px-4 py-2.5 font-mono text-[0.7rem] font-semibold tracking-[0.18em] uppercase transition sm:flex-none ${
                    tab === t.id ? "bg-accent text-white shadow-[0_6px_24px_-8px_var(--glow)]" : "text-muted hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          {filters && (
            <div className="panel grid gap-2 p-2 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-center">
              <label className="relative">
                <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-dim" />
                <input
                  type="search"
                  placeholder="Buscar por nome, tag ou BPM…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="field !border-transparent !bg-transparent pl-9"
                />
              </label>
              <div className="grid grid-cols-3 gap-2 sm:contents">
                <Select label="Gênero" value={genre} onChange={setGenre} options={options.genres} />
                <Select label="Mood" value={mood} onChange={setMood} options={options.moods} />
                <Select label="Tom" value={key} onChange={setKey} options={options.keys} />
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className="label !text-[0.6rem]">BPM</span>
                <input inputMode="numeric" placeholder="60" value={bpmMin} onChange={(e) => setBpmMin(e.target.value.replace(/\D/g, ""))} className="field w-16 !px-2 text-center" aria-label="BPM mínimo" />
                <span className="text-dim">–</span>
                <input inputMode="numeric" placeholder="200" value={bpmMax} onChange={(e) => setBpmMax(e.target.value.replace(/\D/g, ""))} className="field w-16 !px-2 text-center" aria-label="BPM máximo" />
              </div>
            </div>
          )}
        </div>
      )}

      {list.length === 0 ? (
        <p className="panel py-16 text-center text-muted">Nenhum beat encontrado.</p>
      ) : (
        <BeatRows beats={list} fromPriceCents={fromPriceCents} />
      )}
    </div>
  );
}

/** Linhas de beats (usado também na playlist do catálogo). */
export function BeatRows({ beats, fromPriceCents, numbered }: { beats: Beat[]; fromPriceCents: number | null; numbered?: boolean }) {
  const { current, playing, toggle } = usePlayer();
  const { open } = useLicensePicker();

  return (
    <div className="panel overflow-hidden">
      <div className="hidden grid-cols-[3.5rem_1fr_4.5rem_4rem_11rem_14rem] items-center gap-4 border-b border-line px-5 py-3 md:grid">
        <span className="label">{numbered ? "#" : ""}</span>
        <span className="label">Título</span>
        <span className="label">Tempo</span>
        <span className="label">BPM</span>
        <span className="label">Tags</span>
        <span />
      </div>
      <ul className="divide-y divide-line">
        {beats.map((beat, i) => {
          const isCurrent = current?.id === beat.id;
          return (
            <li
              key={beat.id}
              className={`group grid grid-cols-[3.25rem_1fr_auto] items-center gap-3 px-3 py-3 transition sm:px-5 md:grid-cols-[3.5rem_1fr_4.5rem_4rem_11rem_14rem] md:gap-4 ${
                isCurrent ? "bg-accent/[0.07]" : "hover:bg-white/[0.025]"
              }`}
            >
              <button
                type="button"
                aria-label={isCurrent && playing ? `Pausar ${beat.title}` : `Tocar ${beat.title}`}
                onClick={() => toggle(beat, beats)}
                className="relative size-13 overflow-hidden rounded-lg sm:size-14"
              >
                <Cover src={beat.coverUrl} seed={beat.slug} label={beat.title} className="size-full" />
                <span
                  className={`absolute inset-0 grid place-items-center bg-black/55 text-white transition ${
                    isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isCurrent && playing ? <PauseIcon className="size-5" /> : <PlayIcon className="ml-0.5 size-5" />}
                </span>
                {numbered && !isCurrent && (
                  <span className="absolute top-1 left-1 rounded bg-black/70 px-1 font-mono text-[0.6rem] text-white/80 group-hover:opacity-0">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  {isCurrent && (
                    <span className={`eq shrink-0 ${playing ? "" : "paused"}`} aria-hidden>
                      <i />
                      <i />
                      <i />
                    </span>
                  )}
                  <Link
                    href={`/beats/${beat.slug}`}
                    className={`truncate font-semibold tracking-tight uppercase hover:text-accent-hi ${isCurrent ? "text-accent-hi" : ""}`}
                  >
                    {beat.title}
                  </Link>
                </div>
                <p className="label mt-1 truncate !text-[0.6rem] !tracking-[0.16em]">
                  {[beat.genre, beat.moods[0], `${beat.bpm} BPM`, beat.musicalKey].filter(Boolean).join(" · ")}
                </p>
              </div>

              <span className="hidden font-mono text-sm text-muted tabular-nums md:block">{formatTime(beat.durationSeconds)}</span>
              <span className="hidden font-mono text-sm text-muted md:block">{beat.bpm}</span>
              <div className="hidden gap-1.5 overflow-hidden md:flex">
                {beat.tags.slice(0, 2).map((t) => (
                  <span key={t} className="chip truncate">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                {beat.freeDownload && (
                  <button type="button" onClick={() => downloadPreview(beat)} className="btn-icon hidden sm:inline-grid" aria-label="Download grátis (com tag)" title="Download grátis (com tag)">
                    <DownloadIcon className="size-4" />
                  </button>
                )}
                <button type="button" onClick={() => share(beat)} className="btn-icon hidden sm:inline-grid" aria-label="Compartilhar" title="Compartilhar">
                  <ShareIcon className="size-4" />
                </button>
                <button type="button" onClick={() => open(beat)} className="btn btn-primary !gap-1.5 !px-3 !py-2.5 !text-[0.7rem]">
                  <CartIcon className="size-4" />
                  <span className="hidden sm:inline">{fromPriceCents != null ? formatPrice(fromPriceCents) : "Licenças"}</span>
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="field min-w-0 cursor-pointer !py-2.5 font-mono !text-[0.68rem] tracking-[0.12em] uppercase sm:w-auto"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

async function share(beat: Beat) {
  const url = `${location.origin}/beats/${beat.slug}`;
  if (navigator.share) {
    await navigator.share({ title: beat.title, url }).catch(() => {});
  } else {
    await navigator.clipboard?.writeText(url);
    alert("Link copiado!");
  }
}

async function downloadPreview(beat: Beat) {
  try {
    const blob = await (await fetch(beat.previewUrl)).blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${beat.title} (tagged).mp3`;
    a.click();
    URL.revokeObjectURL(a.href);
  } catch {
    window.open(beat.previewUrl, "_blank");
  }
}

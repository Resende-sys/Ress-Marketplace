"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Beat } from "@/lib/types";
import { Cover, PlayIcon, usePlayer } from "./player";

export function BeatCatalog({ beats, fromPriceCents }: { beats: Beat[]; fromPriceCents: number | null }) {
  const { current, playing, toggle } = usePlayer();
  const [query, setQuery] = useState("");
  const [genre, setGenre] = useState("");
  const [mood, setMood] = useState("");

  const genres = useMemo(() => [...new Set(beats.map((b) => b.genre))].sort(), [beats]);
  const moods = useMemo(() => [...new Set(beats.flatMap((b) => b.moods))].sort(), [beats]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return beats.filter(
      (b) =>
        (!genre || b.genre === genre) &&
        (!mood || b.moods.includes(mood)) &&
        (!q ||
          b.title.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q)) ||
          String(b.bpm) === q),
    );
  }, [beats, query, genre, mood]);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          placeholder="Buscar por nome, tag ou BPM…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1 rounded-lg border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm outline-none focus:border-accent"
        />
        <Select label="Gênero" value={genre} onChange={setGenre} options={genres} />
        <Select label="Mood" value={mood} onChange={setMood} options={moods} />
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-zinc-400">Nenhum beat encontrado.</p>
      ) : (
        <ul className="divide-y divide-white/5 rounded-xl border border-white/10 bg-zinc-900/50">
          {filtered.map((beat) => {
            const isCurrent = current?.id === beat.id;
            return (
              <li
                key={beat.id}
                className={`flex items-center gap-4 px-4 py-3 transition hover:bg-white/5 ${isCurrent ? "bg-white/5" : ""}`}
              >
                <button
                  type="button"
                  aria-label={isCurrent && playing ? `Pausar ${beat.title}` : `Tocar ${beat.title}`}
                  onClick={() => toggle(beat, filtered)}
                  className="group relative size-14 shrink-0 overflow-hidden rounded-md"
                >
                  <Cover beat={beat} className="size-full" />
                  <span
                    className={`absolute inset-0 grid place-items-center bg-black/50 text-white transition ${isCurrent ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                  >
                    <PlayIcon playing={isCurrent && playing} />
                  </span>
                </button>

                <div className="min-w-0 flex-1">
                  <Link
                    href={`/beats/${beat.slug}`}
                    className={`block truncate font-semibold hover:underline ${isCurrent ? "text-accent" : ""}`}
                  >
                    {beat.title}
                  </Link>
                  <p className="truncate text-sm text-zinc-400">
                    {beat.bpm} BPM{beat.musicalKey ? ` · ${beat.musicalKey}` : ""} · {beat.genre}
                  </p>
                </div>

                <div className="hidden gap-1.5 md:flex">
                  {beat.tags.slice(0, 3).map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-xs text-zinc-300">
                      #{t}
                    </span>
                  ))}
                </div>

                <Link
                  href={`/beats/${beat.slug}`}
                  className="shrink-0 rounded-lg bg-accent px-3 py-2 text-sm font-semibold text-black transition hover:brightness-110"
                >
                  {fromPriceCents !== null ? formatPrice(fromPriceCents) : "Licenças"}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-white/10 bg-zinc-900 px-3 py-2.5 text-sm outline-none focus:border-accent"
    >
      <option value="">{label}: todos</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

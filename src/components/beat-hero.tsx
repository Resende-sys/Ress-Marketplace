"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Beat, License } from "@/lib/types";
import { Cover, PlayIcon, usePlayer } from "./player";

export function BeatHero({ beat, licenses }: { beat: Beat; licenses: License[] }) {
  const { current, playing, toggle } = usePlayer();
  const isPlaying = current?.id === beat.id && playing;
  const [selected, setSelected] = useState(licenses[0]?.slug ?? "");
  const license = licenses.find((l) => l.slug === selected);

  return (
    <div className="grid gap-10 md:grid-cols-[320px_1fr]">
      <div>
        <Cover beat={beat} className="aspect-square w-full rounded-2xl shadow-2xl" />
        <button
          type="button"
          onClick={() => toggle(beat, [beat])}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 py-3 font-semibold transition hover:bg-white/15"
        >
          <PlayIcon playing={isPlaying} />
          {isPlaying ? "Pausar" : "Ouvir prévia"}
        </button>
      </div>

      <div>
        <p className="text-sm font-medium uppercase tracking-widest text-accent">{beat.genre}</p>
        <h1 className="mt-1 text-4xl font-bold sm:text-5xl">{beat.title}</h1>
        <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-zinc-400">
          <div>
            <dt className="inline">BPM </dt>
            <dd className="inline font-semibold text-white">{beat.bpm}</dd>
          </div>
          {beat.musicalKey && (
            <div>
              <dt className="inline">Tom </dt>
              <dd className="inline font-semibold text-white">{beat.musicalKey}</dd>
            </div>
          )}
          {beat.moods.length > 0 && (
            <div>
              <dt className="inline">Mood </dt>
              <dd className="inline font-semibold text-white">{beat.moods.join(", ")}</dd>
            </div>
          )}
        </dl>

        <h2 className="mt-10 mb-3 text-lg font-semibold">Escolha a licença</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {licenses.map((l) => (
            <label
              key={l.id}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                selected === l.slug ? "border-accent bg-accent/10" : "border-white/10 hover:border-white/30"
              }`}
            >
              <input
                type="radio"
                name="license"
                value={l.slug}
                checked={selected === l.slug}
                onChange={() => setSelected(l.slug)}
                className="sr-only"
              />
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{l.name}</span>
                <span className="font-bold text-accent">
                  {l.isExclusive ? "Sob consulta" : formatPrice(l.priceCents)}
                </span>
              </div>
              <p className="mt-1 text-xs text-zinc-400">{l.files.join(" + ")}</p>
              <ul className="mt-3 space-y-1 text-sm text-zinc-300">
                {l.limits.map((lim) => (
                  <li key={lim}>✓ {lim}</li>
                ))}
              </ul>
            </label>
          ))}
        </div>

        <button
          type="button"
          disabled
          title="O checkout entra na próxima etapa"
          className="mt-6 w-full rounded-xl bg-accent py-3.5 font-bold text-black opacity-60 sm:w-auto sm:px-10"
        >
          {license?.isExclusive ? "Fazer proposta" : "Comprar"} · em breve
        </button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { Beat } from "@/lib/types";
import { PauseIcon, PlayIcon } from "./icons";
import { usePlayer } from "./player";

export function PlayAllButton({ beats }: { beats: Beat[] }) {
  const { current, playing, toggle } = usePlayer();
  const inList = current && beats.some((b) => b.id === current.id);
  if (!beats.length) return null;
  return (
    <button type="button" onClick={() => toggle(inList && current ? current : beats[0], beats)} className="btn btn-primary !px-6 !py-3.5">
      {inList && playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      {inList && playing ? "Pausar" : "Tocar tudo"}
    </button>
  );
}

export function BeatPlayButton({ beat, queue }: { beat: Beat; queue?: Beat[] }) {
  const { current, playing, toggle } = usePlayer();
  const active = current?.id === beat.id && playing;
  return (
    <button type="button" onClick={() => toggle(beat, queue ?? [beat])} className="btn btn-primary w-full !py-4">
      {active ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      {active ? "Pausar" : "Ouvir prévia"}
    </button>
  );
}

/** Prévia de pack (fora da fila de beats). */
export function KitPreviewButton({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  useEffect(() => () => ref.current?.pause(), []);
  return (
    <button
      type="button"
      onClick={() => {
        ref.current ??= Object.assign(new Audio(src), { onended: () => setPlaying(false) });
        if (ref.current.paused) {
          void ref.current.play();
          setPlaying(true);
        } else {
          ref.current.pause();
          setPlaying(false);
        }
      }}
      className="btn btn-ghost w-full !py-3.5"
    >
      {playing ? <PauseIcon className="size-4" /> : <PlayIcon className="size-4" />}
      {playing ? "Pausar prévia" : "Ouvir prévia"}
    </button>
  );
}

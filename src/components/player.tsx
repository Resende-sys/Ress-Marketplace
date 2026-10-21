"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { formatTime } from "@/lib/format";
import { getSupabase } from "@/lib/supabase-browser";
import type { Beat } from "@/lib/types";
import { Cover } from "./cover";
import { CartIcon, NextIcon, PauseIcon, PlayIcon, PrevIcon, VolumeIcon } from "./icons";
import { useLicensePicker } from "./license-picker";

type PlayerState = {
  current: Beat | null;
  playing: boolean;
  /** Toca o beat (ou pausa/retoma se já for o atual). A fila vira `queue`. */
  toggle: (beat: Beat, queue?: Beat[]) => void;
};

const PlayerContext = createContext<PlayerState | null>(null);

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer precisa estar dentro de <PlayerProvider>");
  return ctx;
}

/** Soma 1 reprodução por beat a cada visita (alimenta a aba "Populares"). */
const counted = new Set<string>();
function countPlay(beat: Beat) {
  if (counted.has(beat.id) || beat.id.startsWith("demo-")) return;
  counted.add(beat.id);
  void getSupabase().rpc("increment_play", { beat: beat.id });
}

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [current, setCurrent] = useState<Beat | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);

  const play = useCallback((beat: Beat) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrent(beat);
    setTime(0);
    audio.src = beat.previewUrl;
    void audio.play();
    countPlay(beat);
  }, []);

  const toggle = useCallback(
    (beat: Beat, nextQueue?: Beat[]) => {
      const audio = audioRef.current;
      if (!audio) return;
      if (nextQueue) setQueue(nextQueue);
      if (current?.id === beat.id) {
        if (audio.paused) void audio.play();
        else audio.pause();
      } else {
        play(beat);
      }
    },
    [current, play],
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      if (!current || queue.length === 0) return;
      const i = queue.findIndex((b) => b.id === current.id);
      play(queue[(i + dir + queue.length) % queue.length]);
    },
    [current, queue, play],
  );

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Espaço = play/pause (fora de campos de texto).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (e.code !== "Space" || !current || t.closest("input, textarea, select, button")) return;
      e.preventDefault();
      toggle(current);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [current, toggle]);

  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <PlayerContext.Provider value={{ current, playing, toggle }}>
      {children}
      <audio
        ref={audioRef}
        preload="none"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => step(1)}
      />
      {current && (
        <PlayerBar
          beat={current}
          playing={playing}
          time={time}
          duration={duration}
          progress={progress}
          volume={volume}
          onToggle={() => toggle(current)}
          onStep={step}
          onSeek={(t) => {
            if (audioRef.current) audioRef.current.currentTime = t;
          }}
          onVolume={setVolume}
        />
      )}
    </PlayerContext.Provider>
  );
}

function PlayerBar({
  beat,
  playing,
  time,
  duration,
  progress,
  volume,
  onToggle,
  onStep,
  onSeek,
  onVolume,
}: {
  beat: Beat;
  playing: boolean;
  time: number;
  duration: number;
  progress: number;
  volume: number;
  onToggle: () => void;
  onStep: (dir: 1 | -1) => void;
  onSeek: (t: number) => void;
  onVolume: (v: number) => void;
}) {
  const { open } = useLicensePicker();

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-bg/90 backdrop-blur-xl">
      {/* Barra de progresso fina no topo (toque para pular) */}
      <div className="group relative h-1 cursor-pointer bg-white/5">
        <div
          className="h-full bg-accent shadow-[0_0_12px_var(--glow)] transition-[width] duration-200"
          style={{ width: `${progress}%` }}
        />
        <input
          type="range"
          aria-label="Posição"
          min={0}
          max={duration || 0}
          step={0.1}
          value={time}
          onChange={(e) => onSeek(Number(e.target.value))}
          className="absolute inset-0 -top-2 h-4 w-full cursor-pointer opacity-0"
        />
      </div>

      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2.5 sm:gap-5 sm:px-6">
        <Link href={`/beats/${beat.slug}`} className="flex min-w-0 flex-1 items-center gap-3 sm:flex-none sm:basis-72">
          <Cover src={beat.coverUrl} seed={beat.slug} label={beat.title} className="size-11 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{beat.title}</p>
            <p className="label truncate !text-[0.6rem] !tracking-[0.18em]">
              {beat.bpm} BPM{beat.musicalKey ? ` · ${beat.musicalKey}` : ""}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-1 sm:flex-1 sm:justify-center sm:gap-3">
          <button type="button" aria-label="Anterior" onClick={() => onStep(-1)} className="hidden p-2 text-muted hover:text-white sm:block">
            <PrevIcon className="size-4" />
          </button>
          <button
            type="button"
            aria-label={playing ? "Pausar" : "Tocar"}
            onClick={onToggle}
            className="grid size-11 place-items-center rounded-full bg-accent text-white shadow-[0_0_24px_var(--glow)] transition hover:scale-105 hover:bg-accent-hi"
          >
            {playing ? <PauseIcon className="size-5" /> : <PlayIcon className="ml-0.5 size-5" />}
          </button>
          <button type="button" aria-label="Próximo" onClick={() => onStep(1)} className="p-2 text-muted hover:text-white">
            <NextIcon className="size-4" />
          </button>
          <span className="label ml-2 hidden !tracking-[0.1em] tabular-nums md:inline">
            {formatTime(time)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <label className="hidden items-center gap-2 text-muted lg:flex">
            <VolumeIcon className="size-4" />
            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => onVolume(Number(e.target.value))}
              className="range-accent w-24"
            />
          </label>
          <button type="button" onClick={() => open(beat)} className="btn btn-primary !px-3 !py-2 sm:!px-4">
            <CartIcon className="size-4" />
            <span className="hidden sm:inline">Licenciar</span>
          </button>
        </div>
      </div>
    </div>
  );
}

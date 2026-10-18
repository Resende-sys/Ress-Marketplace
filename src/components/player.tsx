"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { coverGradient, formatTime } from "@/lib/format";
import type { Beat } from "@/lib/types";

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

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [queue, setQueue] = useState<Beat[]>([]);
  const [current, setCurrent] = useState<Beat | null>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);

  const play = useCallback((beat: Beat) => {
    const audio = audioRef.current;
    if (!audio) return;
    setCurrent(beat);
    audio.src = beat.previewUrl;
    void audio.play();
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
      const next = queue[(i + dir + queue.length) % queue.length];
      play(next);
    },
    [current, queue, play],
  );

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return (
    <PlayerContext.Provider value={{ current, playing, toggle }}>
      {children}
      <audio
        ref={audioRef}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => step(1)}
      />
      {current && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-zinc-950/95 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
            <Link href={`/beats/${current.slug}`} className="flex min-w-0 items-center gap-3 sm:w-56">
              <Cover beat={current} className="size-11 shrink-0 rounded-md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{current.title}</p>
                <p className="truncate text-xs text-zinc-400">
                  {current.bpm} BPM · {current.genre}
                </p>
              </div>
            </Link>

            <div className="flex flex-1 flex-col items-center gap-1">
              <div className="flex items-center gap-3">
                <IconButton label="Anterior" onClick={() => step(-1)}>
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </IconButton>
                <button
                  type="button"
                  aria-label={playing ? "Pausar" : "Tocar"}
                  onClick={() => toggle(current)}
                  className="grid size-10 place-items-center rounded-full bg-accent text-black transition hover:scale-105"
                >
                  <PlayIcon playing={playing} />
                </button>
                <IconButton label="Próximo" onClick={() => step(1)}>
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </IconButton>
              </div>
              <div className="hidden w-full items-center gap-2 text-xs text-zinc-400 sm:flex">
                <span className="w-9 text-right tabular-nums">{formatTime(time)}</span>
                <input
                  type="range"
                  aria-label="Posição"
                  min={0}
                  max={duration || 0}
                  step={0.1}
                  value={time}
                  onChange={(e) => {
                    if (audioRef.current) audioRef.current.currentTime = Number(e.target.value);
                  }}
                  className="flex-1 accent-[var(--accent)]"
                />
                <span className="w-9 tabular-nums">{formatTime(duration)}</span>
              </div>
            </div>

            <input
              type="range"
              aria-label="Volume"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="hidden w-24 accent-[var(--accent)] md:block"
            />
          </div>
        </div>
      )}
    </PlayerContext.Provider>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="text-zinc-400 transition hover:text-white"
    >
      <svg viewBox="0 0 24 24" className="size-5 fill-current">
        {children}
      </svg>
    </button>
  );
}

export function PlayIcon({ playing }: { playing: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5 fill-current">
      {playing ? <path d="M6 5h4v14H6zm8 0h4v14h-4z" /> : <path d="M8 5v14l11-7z" />}
    </svg>
  );
}

export function Cover({ beat, className }: { beat: Beat; className?: string }) {
  return beat.coverUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={beat.coverUrl} alt="" className={`object-cover ${className ?? ""}`} />
  ) : (
    <div className={className} style={{ background: coverGradient(beat.slug) }} />
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { formatPrice } from "@/lib/format";
import type { Beat, License } from "@/lib/types";
import { useCart } from "./cart";
import { Cover } from "./cover";
import { BoltIcon, CheckIcon, CloseIcon, FileIcon } from "./icons";

type PickerState = { open: (beat: Beat) => void; licenses: License[]; contactHref: string };
const PickerContext = createContext<PickerState | null>(null);

export function useLicensePicker() {
  const ctx = useContext(PickerContext);
  if (!ctx) throw new Error("useLicensePicker precisa estar dentro de <LicensePickerProvider>");
  return ctx;
}

/** Disponibiliza a janela "Escolha a licença" para qualquer botão do site. */
export function LicensePickerProvider({
  licenses,
  contactHref,
  children,
}: {
  licenses: License[];
  contactHref: string;
  children: React.ReactNode;
}) {
  const [beat, setBeat] = useState<Beat | null>(null);
  const open = useCallback((b: Beat) => setBeat(b), []);

  useEffect(() => {
    if (!beat) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setBeat(null);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [beat]);

  return (
    <PickerContext.Provider value={{ open, licenses, contactHref }}>
      {children}
      {beat && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal aria-label="Escolha a licença">
          <button type="button" aria-label="Fechar" className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setBeat(null)} />
          <div className="panel hud reveal relative max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-b-none p-5 sm:rounded-b-[1.25rem] sm:p-7">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <Cover src={beat.coverUrl} seed={beat.slug} label={beat.title} className="size-12 rounded-lg" />
                <div>
                  <p className="label">Escolha a licença</p>
                  <h2 className="display text-2xl font-bold">{beat.title}</h2>
                </div>
              </div>
              <button type="button" onClick={() => setBeat(null)} className="btn-icon" aria-label="Fechar">
                <CloseIcon className="size-4" />
              </button>
            </div>
            <LicensePanel beat={beat} licenses={licenses} contactHref={contactHref} onDone={() => setBeat(null)} />
          </div>
        </div>
      )}
    </PickerContext.Provider>
  );
}

/** Cartões de licença + termos de uso + total e botões de compra. */
export function LicensePanel({
  beat,
  licenses,
  contactHref,
  onDone,
}: {
  beat: Beat;
  licenses: License[];
  contactHref: string;
  onDone?: () => void;
}) {
  const router = useRouter();
  const { add } = useCart();
  const [selected, setSelected] = useState(
    () => (licenses.find((l) => l.featured && !l.isExclusive) ?? licenses[0])?.slug ?? "",
  );
  const license = licenses.find((l) => l.slug === selected);

  function addToCart(goToCheckout: boolean) {
    if (!license) return;
    add({
      kind: "beat",
      id: `${beat.id}:${license.slug}`,
      beatId: beat.id,
      slug: beat.slug,
      title: beat.title,
      coverUrl: beat.coverUrl,
      licenseSlug: license.slug,
      licenseName: license.name,
      files: license.files,
      priceCents: license.priceCents,
    });
    onDone?.();
    if (goToCheckout) router.push("/checkout");
  }

  return (
    <div>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {licenses.map((l) => {
          const active = l.slug === selected;
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setSelected(l.slug)}
              className={`relative rounded-xl border p-4 text-left transition ${
                active
                  ? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent),0_10px_40px_-15px_var(--glow)]"
                  : "border-line bg-white/[0.02] hover:border-line-strong"
              }`}
            >
              {l.featured && (
                <span className="absolute -top-2.5 right-3 rounded-full bg-accent px-2 py-0.5 font-mono text-[0.55rem] font-bold tracking-[0.15em] text-white uppercase">
                  Mais popular
                </span>
              )}
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold">{l.name}</span>
                <span className={`font-mono text-sm font-bold ${active ? "text-accent-hi" : ""}`}>
                  {l.isExclusive ? "Negociar" : formatPrice(l.priceCents)}
                </span>
              </div>
              <p className="label mt-1.5 !text-[0.6rem]">{l.files.join(" · ")}</p>
            </button>
          );
        })}
      </div>

      {license && (
        <div className="mt-6 border-t border-line pt-5">
          <p className="label mb-3">Termos de uso · {license.name}</p>
          {license.description && <p className="mb-3 text-sm text-muted">{license.description}</p>}
          <ul className="grid gap-2 sm:grid-cols-2">
            <li className="flex items-center gap-2.5 text-sm">
              <FileIcon className="size-4 shrink-0 text-accent-hi" />
              Arquivos: {license.files.join(", ")}
            </li>
            {license.limits.map((lim) => (
              <li key={lim} className="flex items-center gap-2.5 text-sm">
                <CheckIcon className="size-4 shrink-0 text-accent-hi" />
                {lim}
              </li>
            ))}
            <li className="flex items-center gap-2.5 text-sm">
              <BoltIcon className="size-4 shrink-0 text-accent-hi" />
              Entrega imediata + contrato em PDF
            </li>
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="label">Total</p>
          <p className="display text-3xl font-bold">
            {license?.isExclusive ? "Sob consulta" : license ? formatPrice(license.priceCents) : "—"}
          </p>
        </div>
        {license?.isExclusive ? (
          <Link href={contactHref} onClick={onDone} className="btn btn-primary">
            Fazer proposta
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" onClick={() => addToCart(false)} className="btn btn-ghost" disabled={!license}>
              Adicionar
            </button>
            <button type="button" onClick={() => addToCart(true)} className="btn btn-primary" disabled={!license}>
              Comprar agora
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

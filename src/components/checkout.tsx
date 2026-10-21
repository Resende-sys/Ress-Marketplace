"use client";

import Link from "next/link";
import { useState } from "react";
import { formatPrice, whatsappLink } from "@/lib/format";
import type { CartItem } from "@/lib/types";
import { useCart } from "./cart";
import { Cover } from "./cover";
import { ArrowIcon, CardIcon, LockIcon, MailIcon, PixIcon, TrashIcon, WhatsappIcon } from "./icons";

function itemSubtitle(i: CartItem) {
  return i.kind === "beat" ? `Licença ${i.licenseName} · ${i.files.join(", ")}` : "Sound kit · .zip";
}

function ItemRow({ item, onRemove }: { item: CartItem; onRemove?: () => void }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <Cover src={item.coverUrl} seed={item.slug} label={item.title} className="size-14 shrink-0 rounded-lg" />
      <div className="min-w-0 flex-1">
        <Link href={item.kind === "beat" ? `/beats/${item.slug}` : `/packs/${item.slug}`} className="block truncate font-semibold uppercase hover:text-accent-hi">
          {item.title}
        </Link>
        <p className="label mt-1 truncate !text-[0.58rem] !tracking-[0.14em]">{itemSubtitle(item)}</p>
      </div>
      <span className="font-mono text-sm font-semibold">{formatPrice(item.priceCents)}</span>
      {onRemove && (
        <button type="button" onClick={onRemove} className="btn-icon !size-9" aria-label={`Remover ${item.title}`}>
          <TrashIcon className="size-4" />
        </button>
      )}
    </li>
  );
}

export function CartView() {
  const { items, totalCents, remove } = useCart();

  if (items.length === 0) {
    return (
      <div className="panel flex flex-col items-center gap-5 py-20 text-center">
        <p className="display text-3xl font-bold">Carrinho vazio</p>
        <p className="text-muted">Escolha um beat e uma licença para começar.</p>
        <Link href="/beats" className="btn btn-primary">
          Explorar beats <ArrowIcon className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <ul className="panel divide-y divide-line px-4 sm:px-6">
        {items.map((i) => (
          <ItemRow key={i.id} item={i} onRemove={() => remove(i.id)} />
        ))}
      </ul>
      <aside className="panel hud h-fit p-6 lg:sticky lg:top-24">
        <p className="label">Resumo</p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-muted">{items.length} {items.length === 1 ? "item" : "itens"}</span>
          <span className="display text-3xl font-bold">{formatPrice(totalCents)}</span>
        </div>
        <Link href="/checkout" className="btn btn-primary mt-6 w-full !py-4">
          Finalizar compra <ArrowIcon className="size-4" />
        </Link>
        <Link href="/beats" className="btn btn-ghost mt-2 w-full">
          Continuar comprando
        </Link>
      </aside>
    </div>
  );
}

export function CheckoutView({ whatsapp, email }: { whatsapp: string | null; email: string | null }) {
  const { items, totalCents, remove } = useCart();
  const [name, setName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [artist, setArtist] = useState("");
  const [method, setMethod] = useState<"pix" | "card">("pix");

  if (items.length === 0) return <CartView />;

  const summary = [
    `Olá! Quero finalizar este pedido:`,
    ...items.map((i) => `• ${i.title} — ${i.kind === "beat" ? `Licença ${i.licenseName}` : "Sound kit"} — ${formatPrice(i.priceCents)}`),
    `Total: ${formatPrice(totalCents)}`,
    `Pagamento: ${method === "pix" ? "Pix" : "Cartão"}`,
    name && `Nome: ${name}`,
    artist && `Nome artístico: ${artist}`,
    buyerEmail && `E-mail: ${buyerEmail}`,
  ]
    .filter(Boolean)
    .join("\n");

  const manualHref = whatsapp
    ? `${whatsappLink(whatsapp)}?text=${encodeURIComponent(summary)}`
    : email
      ? `mailto:${email}?subject=${encodeURIComponent("Pedido de beats")}&body=${encodeURIComponent(summary)}`
      : null;

  const ready = name.trim() && /\S+@\S+\.\S+/.test(buyerEmail);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
      <div className="space-y-6">
        <section className="panel p-5 sm:p-7">
          <p className="label mb-5">
            <span className="text-accent-hi">01</span> · Seus dados
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="field" placeholder="Nome completo" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
            <input className="field" placeholder="Nome artístico (vai no contrato)" value={artist} onChange={(e) => setArtist(e.target.value)} />
            <input
              className="field sm:col-span-2"
              type="email"
              placeholder="E-mail (onde os arquivos chegam)"
              value={buyerEmail}
              onChange={(e) => setBuyerEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
        </section>

        <section className="panel p-5 sm:p-7">
          <p className="label mb-5">
            <span className="text-accent-hi">02</span> · Pagamento
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: "pix" as const, label: "Pix", hint: "Aprovação na hora", icon: <PixIcon className="size-5" /> },
              { id: "card" as const, label: "Cartão de crédito", hint: "Em até 12x", icon: <CardIcon className="size-5" /> },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                className={`flex items-center gap-4 rounded-xl border p-4 text-left transition ${
                  method === m.id ? "border-accent bg-accent/10 shadow-[0_0_0_1px_var(--accent)]" : "border-line hover:border-line-strong"
                }`}
              >
                <span className={`grid size-11 place-items-center rounded-lg ${method === m.id ? "bg-accent text-white" : "bg-white/5 text-muted"}`}>{m.icon}</span>
                <span>
                  <span className="block font-semibold">{m.label}</span>
                  <span className="label !text-[0.58rem]">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <aside className="panel hud h-fit p-5 sm:p-6 lg:sticky lg:top-24">
        <p className="label">Seu pedido</p>
        <ul className="mt-2 divide-y divide-line">
          {items.map((i) => (
            <ItemRow key={i.id} item={i} onRemove={() => remove(i.id)} />
          ))}
        </ul>
        <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4">
          <span className="label">Total</span>
          <span className="display text-4xl font-bold">{formatPrice(totalCents)}</span>
        </div>

        <button type="button" disabled className="btn btn-primary mt-6 w-full !py-4">
          <LockIcon className="size-4" /> Pagar com {method === "pix" ? "Pix" : "cartão"}
        </button>
        <p className="mt-2 text-center text-xs text-muted">Pagamento online chegando em breve.</p>

        {manualHref && (
          <>
            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line" />
              <span className="label !text-[0.58rem]">ou agora mesmo</span>
              <span className="h-px flex-1 bg-line" />
            </div>
            <a
              href={ready ? manualHref : undefined}
              target="_blank"
              rel="noreferrer"
              aria-disabled={!ready}
              className={`btn btn-ghost w-full !py-4 ${ready ? "" : "pointer-events-none opacity-45"}`}
            >
              {whatsapp ? <WhatsappIcon className="size-4" /> : <MailIcon className="size-4" />}
              Finalizar pelo {whatsapp ? "WhatsApp" : "e-mail"}
            </a>
            {!ready && <p className="mt-2 text-center text-xs text-muted">Preencha nome e e-mail para continuar.</p>}
          </>
        )}
      </aside>
    </div>
  );
}

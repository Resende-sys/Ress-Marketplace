"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useCart } from "./cart";
import { ArrowIcon, CartIcon, CheckIcon, CloseIcon, MenuIcon } from "./icons";

const NAV = [
  { href: "/beats", label: "Beats" },
  { href: "/catalogos", label: "Catálogos" },
  { href: "/packs", label: "Packs" },
  { href: "/licencas", label: "Licenças" },
  { href: "/sobre", label: "Sobre" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader({
  brand,
  announcement,
}: {
  brand: string;
  announcement: { text: string; url: string | null } | null;
}) {
  const pathname = usePathname();
  const { count, flash } = useCart();
  const [menu, setMenu] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- fecha o menu ao trocar de página
  useEffect(() => setMenu(false), [pathname]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      {announcement && (
        <div className="relative z-40 bg-gradient-to-r from-accent-lo via-accent to-accent-lo text-center">
          {announcement.url ? (
            <a href={announcement.url} className="flex items-center justify-center gap-2 px-4 py-2 font-mono text-[0.68rem] font-semibold tracking-[0.2em] text-white uppercase">
              {announcement.text} <ArrowIcon className="size-3.5" />
            </a>
          ) : (
            <p className="px-4 py-2 font-mono text-[0.68rem] font-semibold tracking-[0.2em] text-white uppercase">{announcement.text}</p>
          )}
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-line bg-bg/75 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="display flex items-center gap-2 text-xl font-bold">
            <span className="inline-block size-2.5 rotate-45 bg-accent shadow-[0_0_14px_var(--glow)]" />
            {brand}
          </Link>

          <div className="hidden items-center gap-1 lg:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className={`relative px-3.5 py-2 font-mono text-[0.68rem] tracking-[0.22em] uppercase transition ${
                  isActive(n.href) ? "text-white" : "text-muted hover:text-white"
                }`}
              >
                {n.label}
                {isActive(n.href) && <span className="absolute inset-x-3.5 -bottom-[1.3rem] h-px bg-accent shadow-[0_0_10px_var(--glow)]" />}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Link href="/carrinho" className="btn btn-ghost relative !px-3.5 !py-2" aria-label={`Carrinho (${count})`}>
              <CartIcon className="size-4" />
              <span className="hidden sm:inline">Carrinho</span>
              {count > 0 && (
                <span className="absolute -top-1.5 -right-1.5 grid size-5 place-items-center rounded-full bg-accent font-mono text-[0.6rem] font-bold text-white shadow-[0_0_12px_var(--glow)]">
                  {count}
                </span>
              )}
            </Link>
            <button type="button" className="btn-icon lg:hidden" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
              {menu ? <CloseIcon className="size-4" /> : <MenuIcon className="size-4" />}
            </button>
          </div>
        </nav>

        {menu && (
          <div className="reveal border-t border-line bg-bg/95 px-4 pt-2 pb-6 lg:hidden">
            {NAV.map((n, i) => (
              <Link
                key={n.href}
                href={n.href}
                className="flex items-center justify-between border-b border-line py-4"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <span className={`display text-2xl font-bold ${isActive(n.href) ? "text-accent-hi" : ""}`}>{n.label}</span>
                <span className="label">0{i + 1}</span>
              </Link>
            ))}
          </div>
        )}
      </header>

      {flash && (
        <div className="reveal fixed top-20 right-4 z-[70] flex items-center gap-2 rounded-xl border border-accent/50 bg-surface-2 px-4 py-3 text-sm shadow-[0_10px_40px_-10px_var(--glow)]">
          <CheckIcon className="size-4 text-accent-hi" />
          <span>
            <strong>{flash}</strong> no carrinho
          </span>
        </div>
      )}
    </>
  );
}

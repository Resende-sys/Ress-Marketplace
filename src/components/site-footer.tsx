import Link from "next/link";
import type { SiteSettings } from "@/lib/types";
import { contactList, SocialButtons } from "./socials";

export function SiteFooter({ settings }: { settings: SiteSettings }) {
  const contacts = contactList(settings);
  return (
    <footer className="mt-24 border-t border-line pb-32">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="display flex items-center gap-2 text-2xl font-bold">
            <span className="inline-block size-2.5 rotate-45 bg-accent shadow-[0_0_14px_var(--glow)]" />
            {settings.brandName}
          </p>
          <p className="mt-3 max-w-sm text-sm text-muted">{settings.heroSubtitle}</p>
          <SocialButtons settings={settings} className="mt-5" />
        </div>
        <div>
          <p className="label mb-4">Navegar</p>
          <ul className="grid gap-2.5 text-sm text-muted">
            {[
              ["/beats", "Beats"],
              ["/catalogos", "Catálogos"],
              ["/packs", "Packs"],
              ["/licencas", "Licenças"],
              ["/sobre", "Sobre"],
            ].map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="hover:text-white">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="label mb-4">Contato</p>
          <ul className="grid gap-3 text-sm">
            {contacts.map((c) => (
              <li key={c.label}>
                <a href={c.href} target="_blank" rel="noreferrer" className="flex items-center gap-2.5 text-muted hover:text-white">
                  <span className="text-accent-hi">{c.icon}</span>
                  {c.value}
                </a>
              </li>
            ))}
            <li>
              <Link href="/contato" className="text-muted hover:text-white">
                Entrar na lista →
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-2 border-t border-line px-4 pt-6 sm:px-6">
        <span className="label">© {settings.brandName}</span>
        <span className="label">Pix · Cartão · Entrega imediata</span>
      </div>
    </footer>
  );
}

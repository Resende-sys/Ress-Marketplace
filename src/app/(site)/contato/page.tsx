import type { Metadata } from "next";
import { ArrowIcon } from "@/components/icons";
import { JoinList } from "@/components/join-list";
import { PageHeader } from "@/components/page-header";
import { contactList, socialList } from "@/components/socials";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Contato" };

export default async function ContactPage() {
  const settings = await getSettings();
  const items = [...contactList(settings), ...socialList(settings)];

  return (
    <>
      <PageHeader eyebrow="Contato" title="Bora trabalhar" description="Beat exclusivo, produção sob medida, parcerias ou dúvidas sobre licenças." />
      <div className="mx-auto max-w-7xl space-y-16 px-4 sm:px-6">
        {items.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((i) => (
              <a
                key={i.label}
                href={i.href}
                target="_blank"
                rel="noreferrer"
                className="panel group flex items-center gap-4 p-5 transition hover:border-accent/60 hover:shadow-[0_15px_50px_-25px_var(--glow)]"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-black/40 text-accent-hi">{i.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="label block !text-[0.6rem]">{i.label}</span>
                  <span className="mt-1 block truncate font-semibold">{i.value}</span>
                </span>
                <ArrowIcon className="size-4 text-muted transition group-hover:translate-x-1 group-hover:text-accent-hi" />
              </a>
            ))}
          </div>
        ) : (
          <p className="panel py-12 text-center text-muted">Os contatos aparecem aqui assim que forem cadastrados no painel.</p>
        )}
        <JoinList />
      </div>
    </>
  );
}

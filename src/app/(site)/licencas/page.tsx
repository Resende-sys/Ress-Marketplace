import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { LicenseCards } from "@/components/sections";
import { getLicenses } from "@/lib/catalog";

export const metadata: Metadata = { title: "Licenças" };

const FAQ = [
  {
    q: "O que é uma licença?",
    a: "É a permissão para usar o beat na sua música. O beat continua sendo meu; você compra o direito de lançar com ele dentro dos limites da licença escolhida.",
  },
  {
    q: "Qual licença escolher?",
    a: "Vai soltar um single para testar? A mais simples resolve. Vai trabalhar a música com mix e master de estúdio? Escolha uma com WAV. Precisa mixar cada instrumento separado? Escolha a que vem com stems (trackout).",
  },
  {
    q: "O que são stems / trackout?",
    a: "São as faixas separadas do beat (bateria, baixo, melodias…) em WAV, para o seu engenheiro mixar tudo do jeito certo.",
  },
  {
    q: "E se a música estourar e passar dos limites?",
    a: "É só fazer o upgrade para uma licença maior pagando a diferença. Me chama no contato.",
  },
  {
    q: "O que é a licença exclusiva?",
    a: "Você fica com o beat só para você: ele sai da loja e ninguém mais pode comprá-lo. Quem já tinha comprado licença não exclusiva antes mantém o direito dela. O preço é combinado direto comigo.",
  },
  {
    q: "Como recebo os arquivos?",
    a: "Na hora: depois do pagamento você recebe por e-mail os links de download e o contrato da licença em PDF.",
  },
];

export default async function LicensesPage() {
  const licenses = await getLicenses();
  return (
    <>
      <PageHeader eyebrow="Licenciamento" title="Licenças" description="Termos claros para cada fase da sua carreira. Todas com entrega imediata e contrato." />
      <div className="mx-auto max-w-7xl space-y-20 px-4 sm:px-6">
        <LicenseCards licenses={licenses} />

        <section className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="label !text-accent-hi">Dúvidas</p>
            <h2 className="display mt-3 text-4xl font-bold">Como funciona</h2>
            <p className="mt-3 text-muted">Ainda com dúvida?</p>
            <Link href="/contato" className="btn btn-ghost mt-5">
              Falar comigo
            </Link>
          </div>
          <div className="divide-y divide-line border-y border-line">
            {FAQ.map((f, i) => (
              <details key={f.q} className="group py-5" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                  <span className="flex items-center gap-4">
                    <span className="font-mono text-xs text-accent-hi">0{i + 1}</span>
                    {f.q}
                  </span>
                  <span className="text-xl text-muted transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 pl-9 text-muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

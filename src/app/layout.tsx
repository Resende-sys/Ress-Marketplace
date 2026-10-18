import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { PlayerProvider } from "@/components/player";
import { site } from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.tagline,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <PlayerProvider>
          <header className="sticky top-0 z-40 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
            <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
              <Link href="/" className="text-lg font-black tracking-tight">
                {site.name}
                <span className="text-accent">.</span>
              </Link>
              <div className="flex gap-6 text-sm text-zinc-300">
                <Link href="/" className="hover:text-white">
                  Beats
                </Link>
                <Link href="/#licencas" className="hover:text-white">
                  Licenças
                </Link>
              </div>
            </nav>
          </header>
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-10 pb-32">{children}</main>
          <footer className="border-t border-white/10 py-8 pb-28 text-center text-sm text-zinc-500">
            © {site.name}
          </footer>
        </PlayerProvider>
      </body>
    </html>
  );
}

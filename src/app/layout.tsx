import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Space_Grotesk({ variable: "--font-display", subsets: ["latin"], weight: ["500", "700"] });

export const metadata: Metadata = {
  title: { default: "RESS Beats", template: "%s · RESS Beats" },
  description: "Beats originais com licença na hora. Pix ou cartão, em reais.",
};

export const viewport: Viewport = {
  themeColor: "#050506",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${geistSans.variable} ${geistMono.variable} ${display.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <div className="bg-fx" aria-hidden />
        {children}
      </body>
    </html>
  );
}

import { CartProvider } from "@/components/cart";
import { LicensePickerProvider } from "@/components/license-picker";
import { PlayerProvider } from "@/components/player";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { contactHref } from "@/components/socials";
import { getLicenses, getSettings } from "@/lib/catalog";

// Sempre busca os dados atuais do banco.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, licenses] = await Promise.all([getSettings(), getLicenses()]);
  const announcement = settings.announcementText
    ? { text: settings.announcementText, url: settings.announcementUrl }
    : null;

  return (
    <CartProvider>
      <LicensePickerProvider licenses={licenses} contactHref={contactHref(settings)}>
        <PlayerProvider>
          <SiteHeader brand={settings.brandName} announcement={announcement} />
          <main className="flex-1">{children}</main>
          <SiteFooter settings={settings} />
        </PlayerProvider>
      </LicensePickerProvider>
    </CartProvider>
  );
}

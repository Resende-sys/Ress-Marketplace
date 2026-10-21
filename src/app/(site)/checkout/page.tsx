import type { Metadata } from "next";
import { CheckoutView } from "@/components/checkout";
import { PageHeader } from "@/components/page-header";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const settings = await getSettings();
  return (
    <>
      <PageHeader eyebrow="Compra segura" title="Checkout" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <CheckoutView whatsapp={settings.whatsapp} email={settings.email} />
      </div>
    </>
  );
}

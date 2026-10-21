import type { Metadata } from "next";
import { CartView } from "@/components/checkout";
import { PageHeader } from "@/components/page-header";

export const metadata: Metadata = { title: "Carrinho" };

export default function CartPage() {
  return (
    <>
      <PageHeader eyebrow="Compra" title="Carrinho" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <CartView />
      </div>
    </>
  );
}

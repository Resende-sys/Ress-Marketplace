"use client";

import { useRouter } from "next/navigation";
import type { Soundkit } from "@/lib/types";
import { useCart } from "./cart";

export function KitBuy({ kit }: { kit: Soundkit }) {
  const router = useRouter();
  const { add } = useCart();
  const item = {
    kind: "kit" as const,
    id: `kit:${kit.id}`,
    kitId: kit.id,
    slug: kit.slug,
    title: kit.title,
    coverUrl: kit.coverUrl,
    priceCents: kit.priceCents,
  };
  return (
    <div className="grid gap-2">
      <button type="button" onClick={() => add(item)} className="btn btn-primary !py-4">
        Adicionar ao carrinho
      </button>
      <button
        type="button"
        onClick={() => {
          add(item);
          router.push("/checkout");
        }}
        className="btn btn-ghost !py-4"
      >
        Comprar agora
      </button>
    </div>
  );
}

"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

type CartState = {
  items: CartItem[];
  count: number;
  totalCents: number;
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  /** Mostra o aviso "adicionado ao carrinho". */
  flash: string | null;
};

const CartContext = createContext<CartState | null>(null);
const STORAGE_KEY = "ress-cart-v1";

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de <CartProvider>");
  return ctx;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [flash, setFlash] = useState<string | null>(null);

  // Carrega o carrinho salvo neste navegador.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única do localStorage
      if (Array.isArray(saved)) setItems(saved);
    } catch {
      /* navegador sem localStorage: carrinho só na memória */
    }
  }, []);

  const persist = useCallback((next: CartItem[]) => {
    setItems(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
  }, []);

  const add = useCallback(
    (item: CartItem) => {
      // Um beat entra com uma licença só: trocar de licença substitui a anterior.
      const others = items.filter((i) =>
        item.kind === "beat" ? !(i.kind === "beat" && i.beatId === item.beatId) : i.id !== item.id,
      );
      persist([...others, item]);
      setFlash(item.title);
      setTimeout(() => setFlash(null), 2200);
    },
    [items, persist],
  );

  const remove = useCallback((id: string) => persist(items.filter((i) => i.id !== id)), [items, persist]);
  const clear = useCallback(() => persist([]), [persist]);

  const value = useMemo(
    () => ({
      items,
      count: items.length,
      totalCents: items.reduce((sum, i) => sum + i.priceCents, 0),
      add,
      remove,
      clear,
      flash,
    }),
    [items, add, remove, clear, flash],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

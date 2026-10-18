"use server";

import { updateTag } from "next/cache";

// Chamado pelo painel admin depois de salvar, para o site mostrar a mudança na hora.
export async function refreshCatalog() {
  updateTag("catalog");
}

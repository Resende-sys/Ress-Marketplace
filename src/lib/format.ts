const brl = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export function formatPrice(cents: number) {
  return brl.format(cents / 100);
}

export function formatTime(seconds: number | null | undefined) {
  if (seconds == null || !Number.isFinite(seconds)) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatPlays(n: number) {
  return new Intl.NumberFormat("pt-BR", { notation: "compact" }).format(n);
}

// Capa gerada a partir do nome enquanto o item não tem imagem própria
// (tons de carmesim e grafite, combinando com o site).
export function coverGradient(seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) % 997;
  const angle = (h * 37) % 360;
  const hue = 340 + (h % 30); // 340–370 → carmesim/vinho
  return `radial-gradient(120% 120% at ${20 + (h % 60)}% ${10 + (h % 50)}%, hsl(${hue} 85% 42% / 0.95), transparent 55%), linear-gradient(${angle}deg, #121215, #050506)`;
}

/** Link do WhatsApp a partir de um número digitado de qualquer jeito. */
export function whatsappLink(raw: string) {
  let digits = raw.replace(/\D/g, "");
  if (digits.length <= 11) digits = `55${digits}`;
  return `https://wa.me/${digits}`;
}

/** Aceita "@usuario" ou link completo. */
export function socialLink(kind: "instagram" | "tiktok" | "youtube" | "spotify" | "soundcloud" | "beatstars", raw: string) {
  const v = raw.trim();
  if (/^https?:\/\//i.test(v)) return v;
  const handle = v.replace(/^@/, "");
  switch (kind) {
    case "instagram":
      return `https://instagram.com/${handle}`;
    case "tiktok":
      return `https://tiktok.com/@${handle}`;
    case "youtube":
      return `https://youtube.com/@${handle}`;
    case "soundcloud":
      return `https://soundcloud.com/${handle}`;
    case "beatstars":
      return `https://beatstars.com/${handle}`;
    default:
      return `https://${v}`;
  }
}

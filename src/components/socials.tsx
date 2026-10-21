import { socialLink, whatsappLink } from "@/lib/format";
import type { SiteSettings } from "@/lib/types";
import {
  InstagramIcon,
  LinkIcon,
  MailIcon,
  SoundcloudIcon,
  SpotifyIcon,
  TiktokIcon,
  WhatsappIcon,
  YoutubeIcon,
} from "./icons";

/** Lista de contatos/redes preenchidos no painel (os vazios não aparecem). */
export function socialList(s: SiteSettings) {
  const list: { label: string; href: string; icon: React.ReactNode; value: string }[] = [];
  const icon = "size-4";
  if (s.instagram) list.push({ label: "Instagram", href: socialLink("instagram", s.instagram), icon: <InstagramIcon className={icon} />, value: s.instagram });
  if (s.youtube) list.push({ label: "YouTube", href: socialLink("youtube", s.youtube), icon: <YoutubeIcon className={icon} />, value: s.youtube });
  if (s.tiktok) list.push({ label: "TikTok", href: socialLink("tiktok", s.tiktok), icon: <TiktokIcon className={icon} />, value: s.tiktok });
  if (s.spotify) list.push({ label: "Spotify", href: socialLink("spotify", s.spotify), icon: <SpotifyIcon className={icon} />, value: "Ouvir no Spotify" });
  if (s.soundcloud) list.push({ label: "SoundCloud", href: socialLink("soundcloud", s.soundcloud), icon: <SoundcloudIcon className={icon} />, value: s.soundcloud });
  if (s.beatstars) list.push({ label: "BeatStars", href: socialLink("beatstars", s.beatstars), icon: <LinkIcon className={icon} />, value: "Loja em dólar" });
  return list;
}

export function contactList(s: SiteSettings) {
  const list: { label: string; href: string; icon: React.ReactNode; value: string }[] = [];
  if (s.email) list.push({ label: "E-mail", href: `mailto:${s.email}`, icon: <MailIcon className="size-4" />, value: s.email });
  if (s.whatsapp) list.push({ label: "WhatsApp", href: whatsappLink(s.whatsapp), icon: <WhatsappIcon className="size-4" />, value: s.whatsapp });
  return list;
}

/** Onde mandar quem quer comprar exclusiva / tirar dúvida. */
export function contactHref(s: SiteSettings) {
  if (s.whatsapp) return whatsappLink(s.whatsapp);
  if (s.email) return `mailto:${s.email}`;
  return "/contato";
}

export function SocialButtons({ settings, className = "" }: { settings: SiteSettings; className?: string }) {
  const items = socialList(settings);
  if (!items.length) return null;
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {items.map((i) => (
        <a key={i.label} href={i.href} target="_blank" rel="noreferrer" aria-label={i.label} title={i.label} className="btn-icon">
          {i.icon}
        </a>
      ))}
    </div>
  );
}

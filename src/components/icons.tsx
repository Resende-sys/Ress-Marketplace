// Ícones em SVG (traço fino, combinam com o visual minimalista).

type P = { className?: string };

function Svg({ className = "size-5", children, fill }: P & { children: React.ReactNode; fill?: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill={fill ? "currentColor" : "none"}
      stroke={fill ? "none" : "currentColor"}
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

export const PlayIcon = (p: P) => <Svg {...p} fill><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" /></Svg>;
export const PauseIcon = (p: P) => <Svg {...p} fill><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>;
export const PrevIcon = (p: P) => <Svg {...p} fill><path d="M6 5h2v14H6zm3.5 7 9 6V6z" /></Svg>;
export const NextIcon = (p: P) => <Svg {...p} fill><path d="M16 5h2v14h-2zM5.5 18l9-6-9-6z" /></Svg>;
export const CartIcon = (p: P) => <Svg {...p}><path d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.6a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20" r="1.2" /><circle cx="17" cy="20" r="1.2" /></Svg>;
export const DownloadIcon = (p: P) => <Svg {...p}><path d="M12 4v11m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14" /></Svg>;
export const ShareIcon = (p: P) => <Svg {...p}><circle cx="18" cy="5.5" r="2.5" /><circle cx="6" cy="12" r="2.5" /><circle cx="18" cy="18.5" r="2.5" /><path d="m8.2 10.8 7.6-4.1M8.2 13.2l7.6 4.1" /></Svg>;
export const SearchIcon = (p: P) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="m20 20-4.2-4.2" /></Svg>;
export const MenuIcon = (p: P) => <Svg {...p}><path d="M4 7h16M4 12h16M4 17h10" /></Svg>;
export const CloseIcon = (p: P) => <Svg {...p}><path d="M6 6l12 12M18 6 6 18" /></Svg>;
export const CheckIcon = (p: P) => <Svg {...p}><path d="m5 12.5 4.2 4.2L19 7" /></Svg>;
export const ArrowIcon = (p: P) => <Svg {...p}><path d="M5 12h14m-5-5 5 5-5 5" /></Svg>;
export const ChevronIcon = (p: P) => <Svg {...p}><path d="m9 6 6 6-6 6" /></Svg>;
export const VolumeIcon = (p: P) => <Svg {...p}><path d="M4 9.5h3.5L12 5v14l-4.5-4.5H4z" /><path d="M16 9a4 4 0 0 1 0 6m2.5-8.5a7.5 7.5 0 0 1 0 11" /></Svg>;
export const TrashIcon = (p: P) => <Svg {...p}><path d="M4 7h16M10 11v6m4-6v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></Svg>;
export const MailIcon = (p: P) => <Svg {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></Svg>;
export const DiscIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="2.5" /></Svg>;
export const BoxIcon = (p: P) => <Svg {...p}><path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" /><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" /></Svg>;
export const FileIcon = (p: P) => <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></Svg>;
export const BoltIcon = (p: P) => <Svg {...p}><path d="M13 3 5 13.5h6L10 21l8-10.5h-6z" /></Svg>;
export const PixIcon = (p: P) => <Svg {...p}><path d="m12 3 3.5 3.5L12 10 8.5 6.5zM12 14l3.5 3.5L12 21l-3.5-3.5zM3 12l3.5-3.5L10 12l-3.5 3.5zM14 12l3.5-3.5L21 12l-3.5 3.5z" /></Svg>;
export const CardIcon = (p: P) => <Svg {...p}><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></Svg>;
export const LockIcon = (p: P) => <Svg {...p}><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></Svg>;

// Redes sociais
export const InstagramIcon = (p: P) => <Svg {...p}><rect x="3.5" y="3.5" width="17" height="17" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.6" fill="currentColor" /></Svg>;
export const YoutubeIcon = (p: P) => <Svg {...p}><rect x="2.5" y="5.5" width="19" height="13" rx="4" /><path d="m10.5 9.5 4 2.5-4 2.5z" fill="currentColor" /></Svg>;
export const TiktokIcon = (p: P) => <Svg {...p}><path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5" /><path d="M14 3c.4 2.6 2.2 4.4 5 4.7" /></Svg>;
export const SpotifyIcon = (p: P) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M7.5 9.5c3-1 6.5-.8 9 .7M8 12.5c2.5-.7 5.3-.5 7.4.7M8.6 15.4c2-.5 4-.3 5.6.6" /></Svg>;
export const SoundcloudIcon = (p: P) => <Svg {...p}><path d="M3 17v-3m2.5 3v-5m2.5 5V10m2.5 7V8.5c3.5-1.5 7 .5 7.5 3.5a2.8 2.8 0 0 1 0 5.5h-7.5" /></Svg>;
export const WhatsappIcon = (p: P) => <Svg {...p}><path d="M4 20l1.2-4A8 8 0 1 1 8 19z" /><path d="M9 9.5c.3 2.3 2.2 4.2 4.5 4.5l1-1.2 2 .9c-.2 1.3-1.3 2-2.5 1.8C11 15 9 13 8.5 10.5c-.2-1.2.5-2.3 1.8-2.5l.9 2z" /></Svg>;
export const LinkIcon = (p: P) => <Svg {...p}><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1" /><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1" /></Svg>;

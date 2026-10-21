import Link from "next/link";

export const inputClass = "field";

export function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="label block !text-[0.62rem] !text-text/80">{label}</span>
      {children}
      {hint && <span className="block text-xs text-dim">{hint}</span>}
    </label>
  );
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles = {
    primary: "btn btn-primary",
    ghost: "btn btn-ghost",
    danger: "btn border border-accent/40 bg-accent/10 text-accent-hi hover:bg-accent/20",
  }[variant];
  return <button type="button" {...props} className={`${styles} ${className}`} />;
}

export function AdminTitle({ eyebrow, title, action }: { eyebrow: string; title: string; action?: { href: string; label: string } }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="label !text-accent-hi">{eyebrow}</p>
        <h1 className="display mt-2 text-4xl font-bold">{title}</h1>
      </div>
      {action && (
        <Link href={action.href} className="btn btn-primary">
          {action.label}
        </Link>
      )}
    </div>
  );
}

export function ErrorBox({ children }: { children: React.ReactNode }) {
  return <p className="rounded-xl border border-accent/40 bg-accent/10 p-4 text-sm text-accent-hi">{children}</p>;
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm select-none">
      <span className={`relative h-6 w-11 rounded-full border transition ${checked ? "border-accent bg-accent" : "border-line-strong bg-white/5"}`}>
        <span className={`absolute top-0.5 size-4.5 rounded-full bg-white transition ${checked ? "left-[1.35rem]" : "left-0.5"}`} />
        <input type="checkbox" className="sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      </span>
      {label}
    </label>
  );
}

/** Lista de tags/itens separados por vírgula ↔ array. */
export const splitList = (s: string) =>
  s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

/** Converte "199,90" / "199.90" / "199" em centavos. */
export function parsePrice(v: string) {
  const n = Number(v.replace(/[^\d,.-]/g, "").replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null;
}

export const centsToInput = (c: number | null | undefined) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

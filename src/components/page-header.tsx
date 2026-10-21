export function PageHeader({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 pb-10 sm:px-6 sm:pt-20">
      <p className="reveal label flex items-center gap-2 !text-accent-hi">
        <span className="h-px w-6 bg-accent" />
        {eyebrow}
      </p>
      <h1 className="reveal display mt-4 text-5xl font-bold [animation-delay:60ms] sm:text-7xl">
        {title}
        <span className="text-accent">.</span>
      </h1>
      {description && <p className="reveal mt-4 max-w-2xl text-lg text-muted [animation-delay:120ms]">{description}</p>}
    </div>
  );
}

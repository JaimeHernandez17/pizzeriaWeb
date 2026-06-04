export function CatalogueSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, index) => (
        <article
          key={index}
          className="h-72 animate-pulse rounded-3xl border border-amber-100 bg-white/75 p-4"
        >
          <div className="h-36 rounded-2xl bg-amber-100/80" />
          <div className="mt-4 h-4 w-3/4 rounded bg-amber-100/80" />
          <div className="mt-3 h-4 w-1/2 rounded bg-amber-100/60" />
          <div className="mt-5 h-10 rounded-xl bg-amber-100/80" />
        </article>
      ))}
    </div>
  );
}

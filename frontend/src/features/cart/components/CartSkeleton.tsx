export function CartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <article
          key={index}
          className="animate-pulse rounded-artisan-lg border border-gold-accent/10 bg-white/80 p-4 shadow-artisan-sm"
        >
          <div className="flex gap-4">
            <div className="h-24 w-24 rounded-artisan bg-background-warm/50" />
            <div className="flex-1 space-y-3 pt-2">
              <div className="h-4 w-3/4 rounded-sm bg-background-warm/50" />
              <div className="h-3 w-1/2 rounded-sm bg-background-warm/30" />
              <div className="h-8 w-32 rounded-artisan bg-background-warm/50 mt-4" />
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

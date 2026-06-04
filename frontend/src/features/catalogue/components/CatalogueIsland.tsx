import { startTransition, useEffect, useState, useDeferredValue } from "react";

import { useCart } from "../../cart/hooks/useCart";
import { useCatalogueProducts } from "../hooks/useCatalogueProducts";
import { CatalogueSkeleton } from "./CatalogueSkeleton";
import { ProductGrid } from "./ProductGrid";

type CatalogueIslandProps = {
  apiUrl: string;
  initialQuery: string;
  initialPage: number;
  fallbackTargetId?: string;
};

export function CatalogueIsland({
  apiUrl,
  initialQuery,
  initialPage,
  fallbackTargetId,
}: CatalogueIslandProps) {
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [page, setPage] = useState(initialPage);
  const deferredQuery = useDeferredValue(queryInput.trim());

  const productsQuery = useCatalogueProducts({
    apiUrl,
    query: deferredQuery,
    page,
    pageSize: 12,
  });
  const cartQuery = useCart();

  useEffect(() => {
    console.log("DEBUG: productsQuery.isSuccess", productsQuery.isSuccess, "fallbackTargetId", fallbackTargetId);
    if (!fallbackTargetId) return;
    const target = document.getElementById(fallbackTargetId);
    if (!target) {
        console.warn("DEBUG: fallbackTargetId not found:", fallbackTargetId);
        return;
    }
    if (productsQuery.isSuccess) {
      console.log("DEBUG: hiding fallback target");
      target.setAttribute("hidden", "hidden");
      target.style.display = 'none'; // Force hide
    } else {
      console.log("DEBUG: showing fallback target");
      target.removeAttribute("hidden");
      target.style.display = ''; // Restore
    }
    return () => {
        target.removeAttribute("hidden");
        target.style.display = '';
    };
  }, [fallbackTargetId, productsQuery.isSuccess]);

  const pagination = productsQuery.data?.pagination;
  const cart = cartQuery.data;
  const cartCount = cart?.num_items ?? 0;
  const cartTotal = cart?.total_incl_tax ?? "0.00";
  const cartCurrency = cart?.currency ?? "COP";

  const formattedTotal = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: cartCurrency,
    maximumFractionDigits: 0,
  }).format(Number(cartTotal));

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg md:p-10 relative overflow-hidden"
        onClick={() => console.log("DEBUG: Section clicked")}
        style={{ position: 'relative', zIndex: 1000, pointerEvents: 'auto' }}
    >
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-dark/5 rounded-full -ml-24 -mb-24 blur-3xl" />

      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between border-b border-gold-accent/20 pb-6 relative z-10">
        <div className="space-y-1">
          <p className="font-display text-sm uppercase tracking-[0.3em] text-secondary-red font-bold">
            La Auténtica Pizza Siciliana
          </p>
          <h2 className="font-display text-5xl text-text-primary italic">Nuestro Menú</h2>
          <p className="text-text-secondary max-w-md text-lg italic">
            Tradición artesanal, ingredientes frescos y pasión en cada bocado.
          </p>
        </div>
        <aside
          aria-label="Resumen del carrito"
          className="rounded-artisan bg-green-dark px-6 py-4 text-background-cream shadow-artisan-md flex flex-col items-end gap-1 border border-green-light/20"
        >
          <span className="text-[10px] uppercase tracking-widest text-green-light font-bold">Tu carrito</span>
          <div className="flex items-center gap-3">
            <strong className="text-2xl font-display">{cartCount}</strong>
            <span className="text-green-light">Productos</span>
            <span className="mx-1 opacity-30">|</span>
            <strong className="text-2xl font-display text-gold-accent">{formattedTotal}</strong>
          </div>
        </aside>
      </header>

      <form
        className="mb-10 flex flex-col gap-4 md:flex-row relative z-10"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(() => setPage(1));
        }}
      >
        <div className="relative flex-grow">
          <label htmlFor="react-catalog-search" className="sr-only">
            Buscar pizza
          </label>
          <input
            id="react-catalog-search"
            type="search"
            value={queryInput}
            onChange={(event) => {
              setQueryInput(event.target.value);
              startTransition(() => setPage(1));
            }}
            placeholder="Busca tu pizza preferida..."
            className="w-full rounded-artisan border-2 border-gold-accent/30 bg-background-warm/20 px-5 py-4 text-text-primary placeholder:text-text-secondary/50 outline-none ring-0 transition-all focus:border-primary-red focus:bg-white font-body text-lg shadow-inner"
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gold-accent/50">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </form>

      {productsQuery.isLoading ? <CatalogueSkeleton /> : null}

      {productsQuery.isError ? (
        <div className="rounded-artisan border border-accent-red/30 bg-accent-red/10 p-6 text-text-primary text-center italic shadow-sm">
          <p className="text-xl font-display mb-2">¡Mamma Mia!</p>
          No se pudieron cargar productos. Intenta de nuevo en unos segundos.
        </div>
      ) : null}

      {productsQuery.data ? (
        <div style={{ position: 'relative', zIndex: 100 }}>
          <ProductGrid
            products={productsQuery.data.items}
          />
        </div>
      ) : null}

      {pagination && pagination.total_pages > 1 ? (
        <footer className="mt-12 flex items-center justify-between border-t border-gold-accent/20 pt-8 relative z-10">
          <button
            type="button"
            onClick={() => startTransition(() => setPage(Math.max(1, page - 1)))}
            disabled={page <= 1}
            className="rounded-artisan border-2 border-gold-accent/40 bg-background-warm/30 px-6 py-2 text-sm font-display font-bold text-text-primary transition-all hover:border-primary-red hover:text-primary-red disabled:cursor-not-allowed disabled:opacity-30 uppercase tracking-widest"
          >
            Indietro
          </button>
          <p className="text-base text-text-secondary font-body italic">
            Pagina <span className="font-bold text-text-primary">{pagination.page}</span> di <span className="font-bold text-text-primary">{pagination.total_pages}</span>
          </p>
          <button
            type="button"
            onClick={() =>
              startTransition(() => setPage(Math.min(pagination.total_pages, page + 1)))
            }
            disabled={page >= pagination.total_pages}
            className="rounded-artisan border-2 border-gold-accent/40 bg-background-warm/30 px-6 py-2 text-sm font-display font-bold text-text-primary transition-all hover:border-primary-red hover:text-primary-red disabled:cursor-not-allowed disabled:opacity-30 uppercase tracking-widest"
          >
            Avanti
          </button>
        </footer>
      ) : null}
    </section>
  );
}

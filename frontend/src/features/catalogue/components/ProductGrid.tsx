import type { CatalogueProduct } from "../types";
import { ProductCard } from "./ProductCard";

type ProductGridProps = {
  products: CatalogueProduct[];
};

export function ProductGrid({ products }: ProductGridProps) {
  if (!products.length) {
    return (
      <div className="rounded-artisan border-2 border-dashed border-gold-accent/40 bg-background-warm/10 p-12 text-center text-text-secondary font-body italic text-xl">
        Non abbiamo trovato prodotti con questo filtro.
      </div>
    );
  }

  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
        />
      ))}
    </div>
  );
}

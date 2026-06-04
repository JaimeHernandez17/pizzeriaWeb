import type { CatalogueProduct } from "../types";

type ProductCardProps = {
  product: CatalogueProduct;
};

function formatMoney(value: string | null, currency: string) {
  if (!value) return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
}

function cleanDescription(value: string | null) {
  if (!value) return "";
  const decoded = value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductCard({ product }: ProductCardProps) {
  const description = cleanDescription(product.description);
  const price = formatMoney(product.price.incl_tax, product.price.currency);

  return (
    <article className="group cursor-pointer overflow-hidden rounded-artisan-lg border border-text-primary/10 bg-background-warm/30 shadow-artisan-sm transition-all hover:shadow-artisan-md hover:bg-background-warm/50"
      onClick={() => {
        window.location.href = product.url;
      }}
    >
      <a href={product.url} className="block relative aspect-[4/3] overflow-hidden bg-background-warm no-underline" onClick={(e) => {
          e.stopPropagation();
      }}>
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-text-secondary/50 italic">
            Sin imagen
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-text-primary/20 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      </a>

      <div className="space-y-2 p-5">
        <a href={product.url} className="block group/link no-underline" onClick={(e) => e.stopPropagation()}>
          <h3 className="line-clamp-1 font-display text-xl font-bold text-text-primary group-hover/link:text-primary-red transition-colors">
            {product.title}
          </h3>
          <p className="line-clamp-2 text-base text-text-secondary leading-relaxed font-body">
            {description || "Pizza artesanal preparada al momento con ingredientes frescos de la mejor calidad."}
          </p>
        </a>

        {price && (
          <div className="flex items-center justify-between pt-2 border-t border-gold-accent/20">
            <span className="font-display text-xl font-bold text-primary-red">
              {price}
            </span>
            <button className="px-4 py-1.5 bg-green-dark text-background-cream rounded-artisan text-sm font-semibold hover:bg-green-medium transition-colors uppercase tracking-wider">
              Ver más
            </button>
          </div>
        )}
      </div>
    </article>
  );
}

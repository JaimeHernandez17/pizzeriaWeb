import React from "react";
import type { CatalogueProduct } from "../types";

type ProductInfoProps = {
  product: CatalogueProduct;
  onAddToCart: (productId: number) => void;
};

export const ProductInfo: React.FC<ProductInfoProps> = ({
  product,
  onAddToCart,
}) => {
  const [selectedVariant, setSelectedVariant] = React.useState<CatalogueProduct | null>(
    product.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const formatPrice = (price: string | null, currency: string) => {
    if (!price) return null;
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: currency,
    }).format(parseFloat(price));
  };

  const currentProduct = selectedVariant || product;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-text-primary sm:text-5xl font-display italic">
          {product.title}
        </h1>
        <div className="mt-6 flex items-center justify-between border-b border-gold-accent/20 pb-4">
          <p className="text-3xl font-bold text-primary-red font-display">
            {formatPrice(currentProduct.price.incl_tax, currentProduct.price.currency) ||
              formatPrice(currentProduct.price.excl_tax, currentProduct.price.currency)}
          </p>
          {currentProduct.availability !== undefined && (
            <span className={`inline-flex items-center rounded-artisan px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] ${
              currentProduct.availability ? 'bg-green-medium/10 text-green-dark border border-green-medium/20' : 'bg-primary-red/10 text-primary-red border border-primary-red/20'
            }`}>
              {typeof currentProduct.availability === 'boolean' 
                ? (currentProduct.availability ? '● DISPONIBILE' : '○ ESAURITO')
                : currentProduct.availability}
            </span>
          )}
        </div>
      </div>

      {product.variants && product.variants.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest font-display italic">Scegli la Taglia</h3>
            <span className="text-xs text-text-secondary font-body italic">Tradizione in varie misure</span>
          </div>
          <div className="flex flex-wrap gap-4">
            {product.variants.map((variant) => {
               const sizeAttr = variant.attributes?.find(a => a.name === 'Tamaño');
               const label = sizeAttr ? sizeAttr.value : variant.title;
               const isSelected = selectedVariant?.id === variant.id;
               return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`relative flex min-w-[120px] flex-col items-center justify-center rounded-artisan border-2 px-6 py-4 transition-all duration-300 ${
                    isSelected
                      ? "border-primary-red bg-background-warm text-primary-red shadow-artisan-md transform -translate-y-1"
                      : "border-gold-accent/20 bg-background-cream text-text-secondary hover:border-primary-red/50 hover:bg-background-warm/50"
                  }`}
                >
                  <span className={`text-base font-bold font-display ${isSelected ? 'text-primary-red' : 'text-text-primary'}`}>{label}</span>
                  <span className="mt-1 text-sm font-body italic">
                    {formatPrice(variant.price.incl_tax, variant.price.currency) || formatPrice(variant.price.excl_tax, variant.price.currency)}
                  </span>
                  {isSelected && (
                    <div className="absolute -top-2 -right-2 rounded-full bg-primary-red p-1 text-background-cream shadow-sm ring-2 ring-background-cream">
                      <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </button>
               );
            })}
          </div>
        </div>
      )}

      <div className="pt-2">
        <h3 className="text-sm font-bold text-text-primary uppercase tracking-widest mb-4 font-display italic">Descrizione</h3>
        {product.description ? (
          <div
            className="prose prose-sm max-w-none text-text-secondary leading-relaxed font-body text-lg italic"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        ) : (
          <p className="text-base text-text-secondary/60 italic font-body">Pizza artesanal preparada al momento con ingredientes frescos de la mejor calidad siguiendo la receta tradicional siciliana.</p>
        )}
      </div>

      {product.attributes && product.attributes.length > 0 && (
        <div className="pt-4 bg-background-warm/20 p-6 rounded-artisan border border-gold-accent/10">
          <h3 className="text-xs font-bold text-text-primary uppercase tracking-[0.2em] mb-4">Informazioni Supplementari</h3>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
            {product.upc && (
              <div className="flex flex-col gap-1">
                <dt className="text-[10px] font-bold text-gold-accent uppercase tracking-widest">Codice (UPC)</dt>
                <dd className="text-sm text-text-primary font-body font-bold">{product.upc}</dd>
              </div>
            )}
            {product.attributes.map((attr) => (
              <div key={attr.name} className="flex flex-col gap-1">
                <dt className="text-[10px] font-bold text-gold-accent uppercase tracking-widest">{attr.name}</dt>
                <dd className="text-sm text-text-primary font-body font-bold">{attr.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-6">
        <button
          type="button"
          onClick={() => onAddToCart(currentProduct.id)}
          className="group relative flex w-full items-center justify-center overflow-hidden rounded-artisan bg-green-dark px-8 py-5 text-xl font-display font-bold text-background-cream shadow-artisan-lg transition-all hover:bg-green-medium hover:shadow-xl active:transform active:scale-[0.98] uppercase tracking-widest"
        >
          <span className="relative z-10 flex items-center gap-3">
            <svg className="h-6 w-6 transition-transform group-hover:rotate-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Añadir al Carrito
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
        </button>
      </div>
    </div>
  );
};

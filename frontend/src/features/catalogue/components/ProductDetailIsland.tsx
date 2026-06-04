import React from "react";
import { useProductDetail } from "../hooks/useProductDetail";
import { ProductGallery } from "./ProductGallery";
import { ProductInfo } from "./ProductInfo";
import { ProductCard } from "./ProductCard";
import { ProductReviews } from "./ProductReviews";
import { useAddCartItem } from "../../cart/hooks/useCart";
import { ProductReview } from "../types";

type ProductDetailIslandProps = {
  apiUrl: string;
  productId: string | number;
};

export const ProductDetailIsland: React.FC<ProductDetailIslandProps> = ({
  apiUrl,
  productId,
}) => {
  const { product, loading, error } = useProductDetail(apiUrl, productId);
  const addCartItemMutation = useAddCartItem();
  const [reviews, setReviews] = React.useState<ProductReview[]>([]);

  React.useEffect(() => {
    if (product?.reviews) {
      setReviews(product.reviews);
    }
  }, [product]);

  React.useEffect(() => {
    const target = document.getElementById("react-product-detail-root");
    if (!target) return;
    if (!loading && product) {
      // Hide all children of the root except the React rendered ones if they existed
      // But actually, React replaces the content of the root.
      // However, if there was server-side rendered content inside the root,
      // React will overwrite it when it mounts.
      // If there are other elements we want to hide:
      const fallback = target.querySelector('.product_page');
      if (fallback) {
          (fallback as HTMLElement).style.display = 'none';
      }
    }
  }, [loading, product]);

  const handleAddToCart = (id: number) => {
    console.log("Adding product to cart:", id);
    addCartItemMutation.mutate({ productId: id, quantity: 1 });
  };

  const handleReviewAdded = (newReview: ProductReview) => {
    setReviews([newReview, ...reviews]);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 bg-background-cream">
        <div className="grid grid-cols-1 items-start gap-x-12 gap-y-16 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-artisan bg-background-warm/50 border border-gold-accent/20"></div>
          <div className="space-y-6">
            <div className="h-10 w-3/4 animate-pulse rounded-artisan bg-background-warm/50"></div>
            <div className="h-8 w-1/4 animate-pulse rounded-artisan bg-background-warm/50"></div>
            <div className="h-40 w-full animate-pulse rounded-artisan bg-background-warm/50"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-6 text-center bg-background-cream p-10 rounded-artisan-lg border-2 border-dashed border-gold-accent/30">
        <h2 className="text-4xl font-display font-bold text-text-primary italic">¡Mamma Mia!</h2>
        <p className="text-text-secondary font-body text-xl max-w-md italic">
          Non abbiamo trovato questo prodotto. Potrebbe essere in forno...
        </p>
        <button
          onClick={() => window.location.reload()}
          className="rounded-artisan bg-primary-red px-8 py-3 text-background-cream hover:bg-secondary-red transition-all font-display font-bold shadow-artisan-md uppercase tracking-wider"
        >
          Riprovare
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 bg-background-cream rounded-artisan-lg shadow-artisan-lg border border-gold-accent/20 my-8">
      <div className="grid grid-cols-1 items-start gap-x-12 gap-y-16 lg:grid-cols-2">
        <ProductGallery
          images={product.images}
          mainImage={product.image_url}
          title={product.title}
        />
        <ProductInfo
          product={product}
          onAddToCart={handleAddToCart}
        />
      </div>

      <ProductReviews
        productId={product.id}
        reviews={reviews}
        onReviewAdded={handleReviewAdded}
      />

      {product.recommended_products && product.recommended_products.length > 0 && (
        <div className="mt-24 border-t-2 border-gold-accent/10 pt-16">
          <h2 className="text-4xl font-display font-bold tracking-tight text-text-primary italic text-center mb-12 relative">
            <span className="bg-background-cream px-8 relative z-10">Ti consigliamo anche</span>
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gold-accent/10 -z-0" />
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {product.recommended_products.map((recProduct) => (
              <ProductCard
                key={recProduct.id}
                product={recProduct}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect } from "react";
import { useCart } from "../hooks/useCart";

type MiniBasketProps = {
  apiUrl: string;
  basketUrl: string;
};

function formatMoney(value: string, currency: string) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return value;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(numeric);
}

export const MiniBasket: React.FC<MiniBasketProps> = ({ apiUrl, basketUrl }) => {
  const { data: cart, refetch } = useCart(apiUrl);

  useEffect(() => {
    const handleCartUpdate = () => {
      refetch();
    };

    window.addEventListener("cart-updated", handleCartUpdate);
    return () => {
      window.removeEventListener("cart-updated", handleCartUpdate);
    };
  }, [refetch]);

  if (!cart) {
    return (
      <div className="basket-mini col-sm-5 text-right d-none d-md-block">
        <span className="text-muted">Cargando...</span>
      </div>
    );
  }

  const total = cart.total_incl_tax;
  const currency = cart.currency;

  return (
    <div className="basket-mini col-sm-5 text-right d-none d-md-block flex items-center justify-end gap-6">
      <div className="mr-3">
        <strong className="text-text-secondary mr-2 font-body italic">Total:</strong>
        <span className="font-display font-bold text-xl text-primary-red">{formatMoney(total, currency)}</span>
      </div>

      <div className="btn-group">
        <a
          href={basketUrl}
          className="group relative flex items-center gap-2 px-6 py-2.5 bg-background-warm text-text-primary border-2 border-gold-accent/40 hover:border-primary-red hover:bg-primary-red hover:text-background-cream transition-all font-display font-bold shadow-artisan-sm hover:shadow-artisan-md rounded-artisan no-underline"
        >
          <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="tracking-wide">CARRITO</span>
          {cart.num_items > 0 && (
            <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center bg-accent-red text-[10px] text-white rounded-full ring-2 ring-background-cream shadow-sm font-sans animate-bounce">
              {cart.num_items}
            </span>
          )}
        </a>
      </div>
    </div>
  );
};

import { useEffect, useState } from "react";

import { ApiError } from "../../../shared/lib/http";
import type { CartLine } from "../types";
import { useCart, useDeleteCartLine, useUpdateCartLine } from "../hooks/useCart";
import { CartSkeleton } from "./CartSkeleton";

type CartIslandProps = {
  apiUrl: string;
  checkoutUrl: string;
  continueUrl: string;
  fallbackTargetId?: string;
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

function resolveApiError(error: unknown): string {
  if (error instanceof ApiError) {
    const payload = error.payload;
    if (payload && typeof payload === "object" && "message" in payload) {
      const message = (payload as { message?: unknown }).message;
      if (typeof message === "string" && message.trim()) {
        return message;
      }
    }
  }
  return "No fue posible actualizar el carrito. Intenta nuevamente.";
}

export function CartIsland({
  apiUrl,
  checkoutUrl,
  continueUrl,
  fallbackTargetId,
}: CartIslandProps) {
  const cartQuery = useCart(apiUrl);
  const updateLineMutation = useUpdateCartLine();
  const deleteLineMutation = useDeleteCartLine();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!fallbackTargetId) return;
    const target = document.getElementById(fallbackTargetId);
    if (!target) return;
    if (cartQuery.isSuccess) {
      target.setAttribute("hidden", "hidden");
      target.style.display = 'none';
    } else {
      target.removeAttribute("hidden");
      target.style.display = '';
    }
    return () => {
      target.removeAttribute("hidden");
      target.style.display = '';
    };
  }, [fallbackTargetId, cartQuery.isSuccess]);

  const isBusy = updateLineMutation.isPending || deleteLineMutation.isPending;
  const cart = cartQuery.data;
  const currency = cart?.currency ?? "COP";
  const hasLines = Boolean(cart?.lines.length);
  const canCheckout = Boolean(hasLines) && !isBusy;

  const lineIsProcessing = (lineId: number) =>
    (updateLineMutation.isPending && updateLineMutation.variables?.lineId === lineId) ||
    (deleteLineMutation.isPending && deleteLineMutation.variables === lineId);

  const handleQuantityChange = (line: CartLine, quantity: number) => {
    setErrorMessage(null);
    updateLineMutation.mutate(
      { lineId: line.id, quantity },
      {
        onError: (error) => {
          setErrorMessage(resolveApiError(error));
        },
      },
    );
  };

  const handleDelete = (lineId: number) => {
    setErrorMessage(null);
    deleteLineMutation.mutate(lineId, {
      onError: (error) => {
        setErrorMessage(resolveApiError(error));
      },
    });
  };

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/20 bg-pizza-grain bg-gradient-to-br from-white/40 via-white/20 to-gold-accent/5 p-5 font-body text-text-primary shadow-artisan-lg md:p-7">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-3xl text-text-primary italic">Tu carrito</h2>
          <p className="text-text-secondary italic">
            Ajusta cantidades al instante y confirma tu pedido sin recargar la página.
          </p>
        </div>
        <aside className="rounded-artisan bg-green-dark px-4 py-3 text-sm text-background-cream font-display font-bold uppercase tracking-widest">
          {cart ? (
            <>
              {cart.num_items} item(s) ·{" "}
              <strong>{formatMoney(cart.total_incl_tax, currency)}</strong>
            </>
          ) : (
            "Sincronizando carrito..."
          )}
        </aside>
      </header>

      {cartQuery.isLoading ? <CartSkeleton /> : null}

      {cartQuery.isError ? (
        <div className="rounded-artisan border border-primary-red/30 bg-primary-red/5 p-4 text-sm text-primary-red font-body italic">
          <p>No se pudo cargar el carrito.</p>
          <button
            type="button"
            className="mt-2 rounded-artisan bg-primary-red px-4 py-2 font-display font-bold uppercase tracking-widest text-[10px] text-white transition hover:bg-secondary-red"
            onClick={() => {
              setErrorMessage(null);
              cartQuery.refetch();
            }}
          >
            Reintentar
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <p className="mb-4 rounded-artisan border border-primary-red/30 bg-primary-red/5 px-4 py-2 text-sm text-primary-red font-body italic">
          {errorMessage}
        </p>
      ) : null}

      {cart && hasLines ? (
        <div className="grid gap-5 lg:grid-cols-[1.75fr_1fr]">
          <div className="space-y-4">
            {cart.lines.map((line) => {
              const lineCurrency = line.price.currency || currency;
              const lineBusy = lineIsProcessing(line.id);
              return (
                <article
                  key={line.id}
                  className="rounded-artisan-lg border border-gold-accent/10 bg-white/90 p-4 shadow-artisan-sm"
                >
                  <div className="flex flex-col gap-4 sm:flex-row">
                    <a
                      href={line.product.url}
                      className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-artisan bg-background-warm/30 no-underline"
                    >
                      {line.product.image_url ? (
                        <img
                          src={line.product.image_url}
                          alt={line.product.title}
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform duration-500"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-xs font-display italic text-gold-accent/30">
                          Sin imagen
                        </div>
                      )}
                    </a>

                    <div className="flex-1">
                      <a href={line.product.url} className="block no-underline">
                        <h3 className="font-display text-xl text-text-primary hover:text-primary-red transition-colors">{line.product.title}</h3>
                      </a>
                      <p className="mt-1 text-sm font-body italic text-text-secondary">
                        Unitario:{" "}
                        <strong>{formatMoney(line.price.unit_incl_tax, lineCurrency)}</strong>
                      </p>

                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <div className="inline-flex items-center rounded-artisan border border-gold-accent/30 bg-white">
                          <button
                            type="button"
                            className="px-3 py-1 text-lg font-bold text-text-primary transition hover:bg-background-cream disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Disminuir cantidad de ${line.product.title}`}
                            onClick={() => handleQuantityChange(line, Math.max(0, line.quantity - 1))}
                            disabled={lineBusy}
                          >
                            -
                          </button>
                          <span className="min-w-10 px-2 text-center text-sm font-bold text-text-primary">
                            {line.quantity}
                          </span>
                          <button
                            type="button"
                            className="px-3 py-1 text-lg font-bold text-text-primary transition hover:bg-background-cream disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label={`Aumentar cantidad de ${line.product.title}`}
                            onClick={() => handleQuantityChange(line, line.quantity + 1)}
                            disabled={lineBusy}
                          >
                            +
                          </button>
                        </div>
                        <button
                          type="button"
                          className="rounded-artisan border border-primary-red/30 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-red transition hover:bg-primary-red/5 disabled:cursor-not-allowed disabled:opacity-40"
                          onClick={() => handleDelete(line.id)}
                          disabled={lineBusy}
                        >
                          Eliminar
                        </button>
                        <strong className="ml-auto text-lg font-display text-primary-red">
                          {formatMoney(line.price.line_incl_tax, lineCurrency)}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          <aside className="h-fit rounded-artisan-lg border border-gold-accent/20 bg-green-dark p-6 text-background-cream shadow-artisan-lg">
            <h3 className="font-display text-2xl italic border-b border-gold-accent/30 pb-3">Resumen</h3>
            <dl className="mt-6 space-y-3 font-body text-lg italic text-green-light">
              <div className="flex items-center justify-between">
                <dt>Subtotal</dt>
                <dd>{formatMoney(cart.total_excl_tax, currency)}</dd>
              </div>
              <div className="flex items-center justify-between border-t border-white/10 pt-3">
                <dt className="text-white font-bold not-italic uppercase tracking-widest text-xs">Total</dt>
                <dd className="font-display text-2xl font-bold text-gold-accent">{formatMoney(cart.total_incl_tax, currency)}</dd>
              </div>
            </dl>

            <a
              href={canCheckout ? checkoutUrl : "#"}
              aria-disabled={!canCheckout}
              className="mt-8 block rounded-artisan bg-primary-red px-4 py-4 text-center font-display font-bold uppercase tracking-[0.2em] text-[10px] text-white transition-all hover:bg-secondary-red hover:scale-105 shadow-lg active:scale-95 aria-disabled:pointer-events-none aria-disabled:opacity-40 no-underline"
              onClick={(event) => {
                if (!canCheckout) event.preventDefault();
              }}
            >
              {isBusy ? "Actualizando carrito..." : "Finalizar pedido"}
            </a>
            <a
              href={continueUrl}
              className="mt-4 block rounded-artisan border border-white/25 px-4 py-4 text-center font-display font-bold uppercase tracking-[0.2em] text-[10px] text-white/90 transition-all hover:bg-white/10 hover:scale-105 active:scale-95 no-underline"
            >
              Seguir comprando
            </a>
          </aside>
        </div>
      ) : null}

      {cart && !hasLines ? (
        <div className="rounded-artisan-lg border-2 border-dashed border-gold-accent/30 bg-white/70 p-12 text-center">
          <h3 className="font-display text-2xl text-text-primary italic">Tu carrito está vacío</h3>
          <p className="mt-2 font-body text-text-secondary italic">
            Agrega una pizza para comenzar tu pedido.
          </p>
          <a
            href={continueUrl}
            className="mt-8 inline-block rounded-artisan bg-green-dark px-8 py-3 font-display font-bold uppercase tracking-widest text-xs text-background-cream transition-all hover:bg-green-medium shadow-md active:scale-95 no-underline"
          >
            Ir al menú
          </a>
        </div>
      ) : null}
    </section>
  );
}

import { useEffect, useState } from "react";

type PaymentMethod = "wompi" | "mercadopago" | "cod";

type MethodCopy = {
  label: string;
  description: string;
  ctaHint: string;
  submitLabel: string;
};

type PaymentMethodSummaryIslandProps = {
  selectedMethod: string;
  changeUrl: string;
  fallbackTargetId?: string;
};

type PlaceOrderIslandProps = {
  selectedMethod: string;
  changeUrl: string;
  legacyFormId: string;
  fallbackTargetId?: string;
};

const METHOD_COPY: Record<PaymentMethod, MethodCopy> = {
  cod: {
    label: "Pago Contra Entrega",
    description: "Pagarás al momento de recibir tu pedido.",
    ctaHint: "Al confirmar, registraremos tu pedido como pendiente de pago.",
    submitLabel: "Confirmar el pedido",
  },
  mercadopago: {
    label: "Mercado Pago",
    description: "Serás redirigido a Mercado Pago para completar el pago.",
    ctaHint: "Al continuar, serás redirigido a Mercado Pago para completar la transacción de forma segura.",
    submitLabel: "Continuar con el pago",
  },
  wompi: {
    label: "Wompi",
    description: "Serás redirigido a Wompi para completar el pago.",
    ctaHint: "Al continuar, serás redirigido a Wompi para completar la transacción de forma segura.",
    submitLabel: "Continuar con el pago",
  },
};

function normalizeMethod(value: string): PaymentMethod {
  if (value === "cod" || value === "mercadopago" || value === "wompi") {
    return value;
  }
  return "wompi";
}

function useHideFallback(fallbackTargetId?: string) {
  useEffect(() => {
    if (!fallbackTargetId) return;
    const target = document.getElementById(fallbackTargetId);
    if (!target) return;
    target.setAttribute("hidden", "hidden");
    return () => target.removeAttribute("hidden");
  }, [fallbackTargetId]);
}

export function PaymentMethodSummaryIsland({
  selectedMethod,
  changeUrl,
  fallbackTargetId,
}: PaymentMethodSummaryIslandProps) {
  useHideFallback(fallbackTargetId);
  const method = normalizeMethod(selectedMethod);
  const content = METHOD_COPY[method];

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary-red/5 rounded-full -mr-12 -mt-12 blur-2xl" />
      <p className="font-display text-xs font-bold uppercase tracking-[0.3em] text-secondary-red">
        Resumen de Pago
      </p>
      <h2 className="mt-2 font-display text-3xl text-text-primary italic">Método elegido</h2>
      <p className="mt-2 text-base text-text-secondary font-body italic leading-relaxed">{content.description}</p>

      <div className="mt-6 rounded-artisan border-2 border-primary-red/10 bg-background-warm/30 p-6 shadow-inner">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold-accent mb-1">Seleccionado</p>
        <p className="font-display text-3xl font-bold text-primary-red italic">{content.label}</p>
      </div>

      <a
        href={changeUrl}
        className="mt-6 inline-flex rounded-artisan border-2 border-gold-accent/30 bg-background-warm/10 px-6 py-2.5 text-sm font-display font-bold text-text-primary transition-all hover:border-primary-red hover:text-primary-red uppercase tracking-widest"
      >
        Cambiar método
      </a>
    </section>
  );
}

export function PlaceOrderIsland({
  selectedMethod,
  changeUrl,
  legacyFormId,
  fallbackTargetId,
}: PlaceOrderIslandProps) {
  useHideFallback(fallbackTargetId);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const method = normalizeMethod(selectedMethod);
  const content = METHOD_COPY[method];

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/20 bg-white p-6 font-body text-text-primary shadow-artisan-md">
      <div className="rounded-artisan border-2 border-dashed border-gold-accent/40 bg-background-warm/10 p-5">
        <p className="text-sm font-body italic text-text-primary/80 leading-relaxed text-center">{content.ctaHint}</p>
      </div>

      <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        <a
          href={changeUrl}
          className="inline-flex w-full items-center justify-center rounded-artisan border-2 border-gold-accent/30 bg-background-warm/10 px-8 py-4 text-sm font-display font-bold text-text-primary transition-all hover:bg-background-warm uppercase tracking-widest md:w-auto"
        >
          Modificar pago
        </a>
        <button
          type="button"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-artisan bg-green-dark px-10 py-4 text-lg font-display font-bold text-background-cream transition-all hover:bg-green-medium hover:shadow-artisan-lg disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-artisan-md active:transform active:scale-95 md:w-auto"
          onClick={() => {
            const form = document.getElementById(legacyFormId) as HTMLFormElement | null;
            if (!form) return;
            setIsSubmitting(true);
            form.requestSubmit();
          }}
        >
          {isSubmitting ? "Enviando..." : content.submitLabel}
        </button>
      </div>
    </section>
  );
}

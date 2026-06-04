import { useEffect, useMemo, useState } from "react";

type PaymentMethodOption = {
  value: "wompi" | "mercadopago" | "cod";
  title: string;
  description: string;
  badges: string[];
};

type PaymentMethodIslandProps = {
  actionUrl: string;
  csrfToken: string;
  initialMethod: string;
  fallbackTargetId?: string;
  serverError?: string;
};

const PAYMENT_OPTIONS: PaymentMethodOption[] = [
  {
    value: "wompi",
    title: "Pago Online (Wompi)",
    description: "PSE, tarjetas de crédito y billeteras digitales para confirmar tu pedido en línea.",
    badges: ["PSE", "Tarjeta", "Nequi / Daviplata"],
  },
  {
    value: "mercadopago",
    title: "Mercado Pago",
    description: "Pago rápido con tarjeta y métodos adicionales de Mercado Pago.",
    badges: ["Tarjeta", "Cuotas", "Billetera"],
  },
  {
    value: "cod",
    title: "Pago Contra Entrega",
    description: "Paga cuando recibas tu pizza en la puerta de tu casa.",
    badges: ["Efectivo", "Datáfono"],
  },
];

function resolveInitialMethod(value: string): PaymentMethodOption["value"] {
  if (value === "mercadopago" || value === "cod" || value === "wompi") {
    return value;
  }
  return "wompi";
}

export function PaymentMethodIsland({
  actionUrl,
  csrfToken,
  initialMethod,
  fallbackTargetId,
  serverError,
}: PaymentMethodIslandProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodOption["value"]>(
    resolveInitialMethod(initialMethod),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!fallbackTargetId) return;
    const target = document.getElementById(fallbackTargetId);
    if (!target) return;
    target.setAttribute("hidden", "hidden");
    return () => target.removeAttribute("hidden");
  }, [fallbackTargetId]);

  const selectedOption = useMemo(
    () => PAYMENT_OPTIONS.find((option) => option.value === selectedMethod) ?? PAYMENT_OPTIONS[0],
    [selectedMethod],
  );

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <header className="mb-8 border-b border-gold-accent/20 pb-6 relative z-10">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-secondary-red font-bold">
          Pago
        </p>
        <h2 className="font-display text-4xl text-text-primary italic">Elige cómo pagar</h2>
        <p className="text-text-secondary mt-2 italic">
          Selecciona el método y continúa al resumen final de tu pedido.
        </p>
      </header>

      {serverError ? (
        <div className="mb-6 rounded-artisan border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-primary-red font-bold italic shadow-sm relative z-10">
          {serverError}
        </div>
      ) : null}

      <form
        method="post"
        action={actionUrl}
        onSubmit={() => {
          setIsSubmitting(true);
        }}
        className="relative z-10"
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
        <input type="hidden" name="action" value="set_method" />
        <input type="hidden" name="payment_method" value={selectedMethod} />

        <div className="grid gap-4">
          {PAYMENT_OPTIONS.map((option) => {
            const checked = option.value === selectedMethod;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedMethod(option.value)}
                className={`rounded-artisan border-2 p-5 text-left transition-all duration-300 relative overflow-hidden group ${
                  checked
                    ? "border-primary-red bg-background-warm shadow-artisan-md ring-4 ring-primary-red/5"
                    : "border-gold-accent/20 bg-background-cream hover:border-gold-accent/50 hover:bg-background-warm/30"
                }`}
                aria-pressed={checked}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'border-primary-red bg-primary-red' : 'border-gold-accent/30 bg-white'}`}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <h3 className={`font-display text-xl ${checked ? 'text-primary-red font-bold' : 'text-text-primary'}`}>{option.title}</h3>
                  </div>
                  {checked && (
                    <span className="rounded-artisan bg-primary-red px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-background-cream shadow-sm">
                      Seleccionado
                    </span>
                  )}
                </div>
                <p className={`mt-2 text-sm font-body italic pl-10 ${checked ? 'text-text-primary/70' : 'text-text-secondary'}`}>{option.description}</p>
                <div className="mt-4 flex flex-wrap gap-2 pl-10">
                  {option.badges.map((badge) => (
                    <span
                      key={badge}
                      className={`rounded-artisan border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        checked ? 'border-primary-red/20 bg-primary-red/5 text-primary-red' : 'border-gold-accent/20 bg-gold-accent/5 text-gold-accent'
                      }`}
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>

        <aside className="mt-8 rounded-artisan-lg border border-green-dark/20 bg-green-dark p-6 text-background-cream shadow-artisan-md">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-green-light mb-1">Método elegido</p>
          <p className="font-display text-3xl italic">{selectedOption.title}</p>
          <p className="mt-2 text-base font-body italic text-green-light/80">{selectedOption.description}</p>
        </aside>

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-8 w-full rounded-artisan bg-primary-red px-10 py-5 text-lg font-display font-bold text-background-cream transition-all hover:bg-secondary-red hover:shadow-artisan-lg disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-artisan-md active:transform active:scale-95"
        >
          {isSubmitting ? "Cargando..." : "Continuar al resumen"}
        </button>
      </form>
    </section>
  );
}

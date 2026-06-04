import { useEffect, useState } from "react";

type ShippingMethodOption = {
  code: string;
  name: string;
  description: string;
  cost: string;
};

type ShippingMethodIslandProps = {
  actionUrl: string;
  csrfToken: string;
  initialCode: string;
  options: ShippingMethodOption[];
  fallbackTargetId?: string;
  serverError?: string;
};

function useHideFallback(fallbackTargetId?: string) {
  useEffect(() => {
    if (!fallbackTargetId) return;
    const target = document.getElementById(fallbackTargetId);
    if (!target) return;
    target.setAttribute("hidden", "hidden");
    return () => target.removeAttribute("hidden");
  }, [fallbackTargetId]);
}

export function ShippingMethodIsland({
  actionUrl,
  csrfToken,
  initialCode,
  options,
  fallbackTargetId,
  serverError,
}: ShippingMethodIslandProps) {
  useHideFallback(fallbackTargetId);

  const resolvedInitialCode =
    options.find((option) => option.code === initialCode)?.code ?? options[0]?.code ?? "";
  const [selectedCode, setSelectedCode] = useState(resolvedInitialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!options.length) {
    return null;
  }

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <header className="mb-8 border-b border-gold-accent/20 pb-6 relative z-10">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-secondary-red font-bold">
          Envío
        </p>
        <h2 className="font-display text-4xl text-text-primary italic">Método de envío</h2>
        <p className="text-text-secondary mt-2 italic">
          Elige la opción que prefieras para recibir tus sabores sicilianos.
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
        <input type="hidden" name="method_code" value={selectedCode} />

        <div className="grid gap-4">
          {options.map((option) => {
            const checked = option.code === selectedCode;
            return (
              <button
                key={option.code}
                type="button"
                onClick={() => setSelectedCode(option.code)}
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
                    <h3 className={`font-display text-xl ${checked ? 'text-primary-red font-bold' : 'text-text-primary'}`}>{option.name}</h3>
                  </div>
                  <span className={`rounded-artisan px-4 py-1.5 text-sm font-bold font-display shadow-sm ${checked ? 'bg-primary-red text-background-cream' : 'bg-gold-accent/10 text-gold-accent'}`}>
                    {option.cost}
                  </span>
                </div>
                {option.description ? (
                  <p className={`mt-3 text-sm font-body italic pl-10 ${checked ? 'text-text-primary/70' : 'text-text-secondary'}`}>{option.description}</p>
                ) : null}
              </button>
            );
          })}
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !selectedCode}
          className="mt-8 w-full rounded-artisan bg-green-dark px-10 py-5 text-lg font-display font-bold text-background-cream transition-all hover:bg-green-medium hover:shadow-artisan-lg disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-artisan-md active:transform active:scale-95"
        >
          {isSubmitting ? "Cargando..." : "Continuar al pago"}
        </button>
      </form>
    </section>
  );
}

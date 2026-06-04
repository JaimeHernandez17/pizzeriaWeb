import { useEffect, useState } from "react";

type CheckoutOption = "anonymous" | "new" | "existing";

type GatewayIslandProps = {
  actionUrl: string;
  csrfToken: string;
  passwordResetUrl: string;
  initialEmail: string;
  initialOption: string;
  fallbackTargetId?: string;
  serverError?: string;
};

type OptionCard = {
  value: CheckoutOption;
  title: string;
  description: string;
};

const OPTION_CARDS: OptionCard[] = [
  {
    value: "anonymous",
    title: "Compra como invitado",
    description: "Finaliza rápidamente sin crear una cuenta.",
  },
  {
    value: "new",
    title: "Crear una cuenta",
    description: "Guarda tus datos para tus próximos pedidos.",
  },
  {
    value: "existing",
    title: "Ya tengo una cuenta",
    description: "Inicia sesión con tu contraseña para continuar.",
  },
];

function normalizeOption(value: string): CheckoutOption {
  if (value === "anonymous" || value === "new" || value === "existing") {
    return value;
  }
  return "anonymous";
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

export function GatewayIsland({
  actionUrl,
  csrfToken,
  passwordResetUrl,
  initialEmail,
  initialOption,
  fallbackTargetId,
  serverError,
}: GatewayIslandProps) {
  useHideFallback(fallbackTargetId);
  const [email, setEmail] = useState(initialEmail);
  const [selectedOption, setSelectedOption] = useState<CheckoutOption>(
    normalizeOption(initialOption),
  );
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <header className="mb-8 border-b border-gold-accent/20 pb-6 relative z-10">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-secondary-red font-bold">
          Tu Pedido
        </p>
        <h2 className="font-display text-4xl text-text-primary italic">Comencemos tu pedido</h2>
        <p className="text-text-secondary mt-2 italic">
          Dinos quién eres para proceder con la dirección, el envío y el pago.
        </p>
      </header>

      {serverError ? (
        <div className="mb-6 rounded-artisan border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-primary-red font-bold italic shadow-sm relative z-10">
          <svg className="w-5 h-5 inline mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {serverError}
        </div>
      ) : null}

      <form
        method="post"
        action={actionUrl}
        onSubmit={() => {
          setIsSubmitting(true);
        }}
        className="space-y-6 relative z-10"
      >
        <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
        <input type="hidden" name="options" value={selectedOption} />

        <div className="bg-background-warm/20 p-6 rounded-artisan border border-gold-accent/10">
          <label htmlFor="gateway-email" className="mb-2 block text-xs font-bold text-text-primary uppercase tracking-widest">
            Dirección de Email
          </label>
          <input
            id="gateway-email"
            name="username"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
            placeholder="tu-email@ejemplo.com"
          />
        </div>

        <div className="grid gap-4">
          <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">¿Cómo prefieres proceder?</label>
          {OPTION_CARDS.map((option) => {
            const checked = option.value === selectedOption;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelectedOption(option.value)}
                className={`rounded-artisan border-2 p-5 text-left transition-all duration-300 relative overflow-hidden group ${
                  checked
                    ? "border-primary-red bg-background-warm shadow-artisan-md ring-4 ring-primary-red/5"
                    : "border-gold-accent/20 bg-background-cream hover:border-gold-accent/50 hover:bg-background-warm/30"
                }`}
                aria-pressed={checked}
              >
                <div className="flex items-center gap-4 relative z-10">
                   <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${checked ? 'border-primary-red bg-primary-red' : 'border-gold-accent/30 bg-white'}`}>
                      {checked && <div className="w-2 h-2 rounded-full bg-white" />}
                   </div>
                   <div>
                     <h3 className={`font-display text-xl ${checked ? 'text-primary-red font-bold' : 'text-text-primary'}`}>{option.title}</h3>
                     <p className={`mt-1 text-sm font-body italic ${checked ? 'text-text-primary/70' : 'text-text-secondary'}`}>{option.description}</p>
                   </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedOption === "existing" ? (
          <div className="rounded-artisan border-2 border-primary-red/30 bg-background-warm p-6 animate-in fade-in slide-in-from-top-2 duration-300 shadow-inner">
            <label htmlFor="gateway-password" className="mb-2 block text-xs font-bold text-text-primary uppercase tracking-widest">
              Password
            </label>
            <input
              id="gateway-password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
              placeholder="Ingresa tu contraseña"
            />
            <a
              href={passwordResetUrl}
              className="mt-3 inline-block text-xs font-bold text-secondary-red hover:text-primary-red transition-colors uppercase tracking-widest underline underline-offset-4 decoration-gold-accent/30"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>
        ) : (
          <input type="hidden" name="password" value="" />
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-artisan bg-green-dark px-10 py-5 text-lg font-display font-bold text-background-cream transition-all hover:bg-green-medium hover:shadow-artisan-lg disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-artisan-md active:transform active:scale-95"
        >
          {isSubmitting ? "Cargando..." : "Continuar pedido"}
        </button>
      </form>
    </section>
  );
}

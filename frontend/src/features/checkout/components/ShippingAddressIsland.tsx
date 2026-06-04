import { useEffect, useState } from "react";

type CityOption = {
  value: string;
  label: string;
};

type AddressBookItem = {
  id: string;
  lines: string[];
  isDefault: boolean;
  editUrl: string;
  deleteUrl: string;
};

type AddressValues = {
  first_name: string;
  last_name: string;
  line1: string;
  line2: string;
  city: string;
  phone_number: string;
  notes: string;
};

type AddressErrors = Record<string, string[]>;

type ShippingAddressIslandProps = {
  actionUrl: string;
  basketUrl: string;
  csrfToken: string;
  values: AddressValues;
  cities: CityOption[];
  addresses: AddressBookItem[];
  errors: AddressErrors;
  fallbackTargetId?: string;
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

function FieldErrors({ messages }: { messages?: string[] }) {
  if (!messages?.length) return null;
  return (
    <ul className="mt-1 space-y-1 text-xs text-red-700">
      {messages.map((message, index) => (
        <li key={`${message}-${index}`}>{message}</li>
      ))}
    </ul>
  );
}

export function ShippingAddressIsland({
  actionUrl,
  basketUrl,
  csrfToken,
  values,
  cities,
  addresses,
  errors,
  fallbackTargetId,
}: ShippingAddressIslandProps) {
  useHideFallback(fallbackTargetId);
  const [formValues, setFormValues] = useState<AddressValues>(values);
  const [submittingNewAddress, setSubmittingNewAddress] = useState(false);
  const [submittingAddressId, setSubmittingAddressId] = useState<string | null>(null);

  const updateValue = (field: keyof AddressValues, value: string) => {
    setFormValues((previous) => ({ ...previous, [field]: value }));
  };

  return (
    <section className="react-island rounded-artisan-lg border border-gold-accent/30 bg-background-cream p-6 font-body text-text-primary shadow-artisan-lg md:p-10 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary-red/5 rounded-full -mr-16 -mt-16 blur-3xl" />
      
      <header className="mb-8 border-b border-gold-accent/20 pb-6 relative z-10">
        <p className="font-display text-sm uppercase tracking-[0.3em] text-secondary-red font-bold">
          Entrega
        </p>
        <h2 className="font-display text-4xl text-text-primary italic">Dirección de envío</h2>
        <p className="text-text-secondary mt-2 italic">Confirma dónde debemos llevar tu pedido.</p>
      </header>

      {errors.__all__?.length ? (
        <div className="mb-6 rounded-artisan border border-accent-red/30 bg-accent-red/10 p-4 text-sm text-primary-red font-bold italic shadow-sm relative z-10">
          {errors.__all__.join(" ")}
        </div>
      ) : null}

      {addresses.length ? (
        <section className="mb-10 relative z-10">
          <h3 className="mb-6 font-display text-2xl text-text-primary italic border-l-4 border-primary-red pl-4">Usa una dirección guardada</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => (
              <article key={address.id} className="rounded-artisan border-2 border-gold-accent/20 bg-background-warm/20 p-6 transition-all hover:border-gold-accent/50 shadow-sm flex flex-col justify-between">
                <div className="space-y-1 text-base font-body italic text-text-primary">
                  {address.lines.map((line, index) => (
                    <p key={`${address.id}-${index}`}>{line}</p>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  <form
                    method="post"
                    action={actionUrl}
                    onSubmit={() => setSubmittingAddressId(address.id)}
                  >
                    <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />
                    <input type="hidden" name="action" value="ship_to" />
                    <input type="hidden" name="address_id" value={address.id} />
                    <button
                      type="submit"
                      disabled={submittingAddressId === address.id || submittingNewAddress}
                      className="w-full rounded-artisan bg-green-dark px-4 py-3 text-sm font-display font-bold text-background-cream transition-all hover:bg-green-medium disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-sm"
                    >
                      {submittingAddressId === address.id
                        ? "Guardando..."
                        : address.isDefault
                          ? "Usar dirección predeterminada"
                          : "Usar esta dirección"}
                    </button>
                  </form>

                  <div className="flex gap-2">
                    <a
                      href={address.editUrl}
                      className="flex-1 rounded-artisan border-2 border-gold-accent/30 px-3 py-2 text-center text-xs font-bold text-text-primary transition-all hover:bg-background-warm uppercase tracking-widest"
                    >
                      Editar
                    </a>
                    <a
                      href={address.deleteUrl}
                      className="flex-1 rounded-artisan border-2 border-accent-red/30 px-3 py-2 text-center text-xs font-bold text-primary-red transition-all hover:bg-accent-red/5 uppercase tracking-widest"
                    >
                      Eliminar
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="relative z-10">
        <h3 className="mb-6 font-display text-2xl text-text-primary italic border-l-4 border-primary-red pl-4">Nueva dirección</h3>
        <form
          method="post"
          action={actionUrl}
          className="space-y-6 rounded-artisan border-2 border-gold-accent/10 bg-background-warm/10 p-8 shadow-inner"
          onSubmit={() => setSubmittingNewAddress(true)}
        >
          <input type="hidden" name="csrfmiddlewaretoken" value={csrfToken} />

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Nombre</label>
              <input
                name="first_name"
                value={formValues.first_name}
                onChange={(event) => updateValue("first_name", event.target.value)}
                className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
                placeholder="Ej. Mario"
              />
              <FieldErrors messages={errors.first_name} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Apellido</label>
              <input
                name="last_name"
                value={formValues.last_name}
                onChange={(event) => updateValue("last_name", event.target.value)}
                className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
                placeholder="Ej. Pérez"
              />
              <FieldErrors messages={errors.last_name} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Dirección</label>
            <input
              name="line1"
              value={formValues.line1}
              onChange={(event) => updateValue("line1", event.target.value)}
              className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
              placeholder="Calle Principal 123"
            />
            <FieldErrors messages={errors.line1} />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Punto de referencia / Interfono</label>
            <input
              name="line2"
              value={formValues.line2}
              onChange={(event) => updateValue("line2", event.target.value)}
              className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
              placeholder="Ej. Interior 4, segundo piso"
            />
            <FieldErrors messages={errors.line2} />
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Ciudad</label>
              <div className="relative">
                <select
                  name="city"
                  value={formValues.city}
                  onChange={(event) => updateValue("city", event.target.value)}
                  className="w-full appearance-none rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary outline-none transition-all focus:border-primary-red focus:bg-white font-body"
                >
                  <option value="">Selecciona una ciudad</option>
                  {cities.map((city) => (
                    <option key={city.value} value={city.value}>
                      {city.label}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gold-accent">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
              <FieldErrors messages={errors.city} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Teléfono</label>
              <input
                name="phone_number"
                value={formValues.phone_number}
                onChange={(event) => updateValue("phone_number", event.target.value)}
                className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
                placeholder="+57 300 123 4567"
              />
              <FieldErrors messages={errors.phone_number} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-primary uppercase tracking-widest px-1">Instrucciones especiales para la entrega</label>
            <textarea
              name="notes"
              rows={3}
              value={formValues.notes}
              onChange={(event) => updateValue("notes", event.target.value)}
              className="w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream px-5 py-3 text-text-primary placeholder:text-text-secondary/40 outline-none transition-all focus:border-primary-red focus:bg-white font-body"
              placeholder="Ej. Dejar el paquete en portería"
            />
            <FieldErrors messages={errors.notes} />
          </div>

          <div className="flex flex-col gap-4 pt-4 md:flex-row md:items-center">
            <button
              type="submit"
              disabled={submittingNewAddress || Boolean(submittingAddressId)}
              className="w-full rounded-artisan bg-primary-red px-10 py-5 text-lg font-display font-bold text-background-cream transition-all hover:bg-secondary-red hover:shadow-artisan-lg disabled:cursor-not-allowed disabled:opacity-40 uppercase tracking-widest shadow-artisan-md active:transform active:scale-95 md:w-auto"
            >
              {submittingNewAddress ? "Cargando..." : "Continuar pedido"}
            </button>
            <a
              href={basketUrl}
              className="w-full rounded-artisan border-2 border-gold-accent/30 bg-background-warm/30 px-8 py-5 text-center text-sm font-display font-bold text-text-primary transition-all hover:bg-background-warm uppercase tracking-widest md:w-auto"
            >
              Volver al carrito
            </a>
          </div>
        </form>
      </section>
    </section>
  );
}

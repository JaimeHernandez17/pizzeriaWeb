import React from "react";
import { ProductReview } from "../types";

type ProductReviewsProps = {
  productId: number;
  reviews: ProductReview[];
  onReviewAdded: (review: ProductReview) => void;
};

export const ProductReviews: React.FC<ProductReviewsProps> = ({
  productId,
  reviews,
  onReviewAdded,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [formData, setFormData] = React.useState({
    name: "",
    score: 5,
    body: "",
  });
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/v1/catalog/products/${productId}/reviews/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Error al enviar la reseña");
      }

      const newReview = await response.json();
      onReviewAdded(newReview);
      setFormData({ name: "", score: 5, body: "" });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mt-20 border-t-2 border-gold-accent/10 pt-20">
      <div className="grid grid-cols-1 gap-x-16 gap-y-12 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-display font-bold text-text-primary italic mb-8">Esperienza dei nostri clienti</h2>
          
          <div className="mt-10 space-y-12">
            {reviews.length === 0 ? (
              <p className="text-text-secondary italic font-body text-lg">Non ci sono ancora recensioni. Sii il primo a commentare!</p>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="flex flex-col bg-background-warm/10 p-6 rounded-artisan border border-gold-accent/5 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-dark text-background-cream font-display font-bold text-xl shadow-inner">
                      {review.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-text-primary font-display">{review.name}</h4>
                      <div className="mt-1 flex items-center">
                        {[0, 1, 2, 3, 4].map((rating) => (
                          <svg
                            key={rating}
                            className={`h-4 w-4 flex-shrink-0 ${
                              review.score > rating ? "text-gold-accent" : "text-gold-accent/20"
                            }`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 text-base text-text-secondary leading-relaxed font-body italic">
                    <p>"{review.body}"</p>
                  </div>
                  <div className="mt-4 text-xs text-gold-accent/60 font-bold uppercase tracking-widest">
                    {new Date(review.date_created).toLocaleDateString("it-IT")}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-artisan-lg bg-background-warm/30 p-10 border border-gold-accent/20 shadow-artisan-md self-start">
          <h3 className="text-2xl font-display font-bold text-text-primary italic">Lascia la tua recensione</h3>
          <p className="mt-2 text-base text-text-secondary font-body italic mb-8">Raccontaci la tua esperienza con i nostri sapori.</p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
                Nome
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream/50 px-4 py-3 text-text-primary outline-none transition-all focus:border-primary-red focus:bg-white sm:text-sm font-body"
                placeholder="Il tuo nome"
                required
              />
            </div>
            
            <div>
              <label htmlFor="score" className="block text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
                Valutazione
              </label>
              <div className="relative">
                <select
                  id="score"
                  value={formData.score}
                  onChange={(e) => setFormData({ ...formData, score: parseInt(e.target.value) })}
                  className="block w-full appearance-none rounded-artisan border-2 border-gold-accent/20 bg-background-cream/50 px-4 py-3 text-text-primary outline-none transition-all focus:border-primary-red focus:bg-white sm:text-sm font-body"
                >
                  <option value="5">⭐⭐⭐⭐⭐ (Eccellente)</option>
                  <option value="4">⭐⭐⭐⭐ (Molto buono)</option>
                  <option value="3">⭐⭐⭐ (Buono)</option>
                  <option value="2">⭐⭐ (Scarso)</option>
                  <option value="1">⭐ (Pessimo)</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gold-accent">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </div>
            </div>
            
            <div>
              <label htmlFor="body" className="block text-xs font-bold text-text-primary uppercase tracking-widest mb-2">
                Commento
              </label>
              <textarea
                id="body"
                rows={4}
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="block w-full rounded-artisan border-2 border-gold-accent/20 bg-background-cream/50 px-4 py-3 text-text-primary outline-none transition-all focus:border-primary-red focus:bg-white sm:text-sm font-body"
                placeholder="Cosa ne pensi?"
                required
              ></textarea>
            </div>
            
            {error && <p className="text-sm text-primary-red font-bold italic">{error}</p>}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex w-full justify-center rounded-artisan bg-primary-red px-8 py-4 text-base font-display font-bold text-background-cream shadow-artisan-md transition-all hover:bg-secondary-red uppercase tracking-widest active:transform active:scale-95 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Inviando..." : "Invia Recensione"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

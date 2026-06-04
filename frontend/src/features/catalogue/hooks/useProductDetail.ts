import { useState, useEffect, useCallback } from "react";
import { fetchProductDetail } from "../api/catalogueApi";
import type { CatalogueProduct } from "../types";

export function useProductDetail(apiUrl: string, productId: number | string) {
  const [product, setProduct] = useState<CatalogueProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const loadProduct = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProductDetail(apiUrl, productId);
      setProduct(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Failed to fetch product"));
    } finally {
      setLoading(false);
    }
  }, [apiUrl, productId]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  return { product, loading, error, reload: loadProduct };
}

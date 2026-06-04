import { httpGet } from "../../../shared/lib/http";
import type { CatalogueResponse, CatalogueProduct } from "../types";

export type FetchProductsParams = {
  apiUrl: string;
  query: string;
  page: number;
  pageSize: number;
};

export async function fetchCatalogueProducts(
  params: FetchProductsParams,
): Promise<CatalogueResponse> {
  const searchParams = new URLSearchParams({
    page: String(params.page),
    page_size: String(params.pageSize),
  });
  if (params.query) {
    searchParams.set("q", params.query);
  }

  return httpGet<CatalogueResponse>(`${params.apiUrl}?${searchParams.toString()}`);
}

export async function fetchProductDetail(
  apiUrl: string,
  productId: number | string,
): Promise<CatalogueProduct> {
  return httpGet<CatalogueProduct>(`${apiUrl}${productId}/`);
}

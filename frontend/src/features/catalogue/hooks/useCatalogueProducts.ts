import { useQuery } from "@tanstack/react-query";

import { fetchCatalogueProducts } from "../api/catalogueApi";

type UseCatalogueProductsParams = {
  apiUrl: string;
  query: string;
  page: number;
  pageSize?: number;
};

export function useCatalogueProducts(params: UseCatalogueProductsParams) {
  const pageSize = params.pageSize ?? 12;

  return useQuery({
    queryKey: ["catalogue-products", params.apiUrl, params.query, params.page, pageSize],
    queryFn: () =>
      fetchCatalogueProducts({
        apiUrl: params.apiUrl,
        query: params.query,
        page: params.page,
        pageSize,
      }),
    staleTime: 30_000,
  });
}

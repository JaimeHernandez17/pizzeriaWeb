import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { ProductDetailIsland } from "../features/catalogue/components/ProductDetailIsland";
import "../styles/index.css";

const rootElement = document.getElementById("react-product-detail-root");

if (rootElement) {
  const apiUrl = rootElement.dataset.apiUrl ?? "/api/v1/catalog/products/";
  const productId = rootElement.dataset.productId;

  if (!productId) {
    console.error("Product ID is missing from root element dataset");
  } else {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: 1,
          refetchOnWindowFocus: false,
        },
      },
    });

    createRoot(rootElement).render(
      <StrictMode>
        <QueryClientProvider client={queryClient}>
          <ProductDetailIsland apiUrl={apiUrl} productId={productId} />
        </QueryClientProvider>
      </StrictMode>,
    );
  }
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CatalogueIsland } from "../features/catalogue/components/CatalogueIsland";
import "../styles/index.css";

const rootElement = document.getElementById("react-catalogue-root");

if (rootElement) {
  const apiUrl = rootElement.dataset.apiUrl ?? "/api/v1/catalog/products/";
  const initialQuery = rootElement.dataset.initialQuery ?? "";
  const initialPage = Number(rootElement.dataset.initialPage || 1);
  const fallbackTargetId = rootElement.dataset.fallbackTargetId;

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
        <CatalogueIsland
          apiUrl={apiUrl}
          initialQuery={initialQuery}
          initialPage={Number.isNaN(initialPage) ? 1 : initialPage}
          fallbackTargetId={fallbackTargetId}
        />
      </QueryClientProvider>
    </StrictMode>,
  );
}

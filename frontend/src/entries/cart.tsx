import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { CartIsland } from "../features/cart/components/CartIsland";
import "../styles/index.css";

const rootElement = document.getElementById("react-cart-root");

if (rootElement) {
  const apiUrl = rootElement.dataset.apiUrl ?? "/api/v1/cart/";
  const checkoutUrl = rootElement.dataset.checkoutUrl ?? "/checkout/";
  const continueUrl = rootElement.dataset.continueUrl ?? "/";
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
        <CartIsland
          apiUrl={apiUrl}
          checkoutUrl={checkoutUrl}
          continueUrl={continueUrl}
          fallbackTargetId={fallbackTargetId}
        />
      </QueryClientProvider>
    </StrictMode>,
  );
}

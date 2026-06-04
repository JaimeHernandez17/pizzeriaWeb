import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { MiniBasket } from "../features/cart/components/MiniBasket";
import "../styles/index.css";

const rootElement = document.getElementById("react-mini-basket-root");

if (rootElement) {
  const apiUrl = rootElement.dataset.apiUrl ?? "/api/v1/cart/";
  const basketUrl = rootElement.dataset.basketUrl ?? "/basket/";

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
        <MiniBasket apiUrl={apiUrl} basketUrl={basketUrl} />
      </QueryClientProvider>
    </StrictMode>,
  );
}

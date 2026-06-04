import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PaymentMethodIsland } from "../features/checkout/components/PaymentMethodIsland";
import { getCsrfToken } from "../shared/lib/csrf";
import "../styles/index.css";

const rootElement = document.getElementById("react-payment-method-root");

if (rootElement) {
  const actionUrl = rootElement.dataset.actionUrl ?? "/checkout/payment-details/";
  const rawCsrfToken = rootElement.dataset.csrfToken ?? "";
  const csrfToken =
    rawCsrfToken && rawCsrfToken !== "NOTPROVIDED" ? rawCsrfToken : getCsrfToken();
  const initialMethod = rootElement.dataset.initialMethod ?? "wompi";
  const fallbackTargetId = rootElement.dataset.fallbackTargetId;
  const serverError = rootElement.dataset.serverError ?? "";

  createRoot(rootElement).render(
    <StrictMode>
      <PaymentMethodIsland
        actionUrl={actionUrl}
        csrfToken={csrfToken}
        initialMethod={initialMethod}
        fallbackTargetId={fallbackTargetId}
        serverError={serverError}
      />
    </StrictMode>,
  );
}

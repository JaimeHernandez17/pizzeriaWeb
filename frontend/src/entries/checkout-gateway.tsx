import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { GatewayIsland } from "../features/checkout/components/GatewayIsland";
import { getCsrfToken } from "../shared/lib/csrf";
import "../styles/index.css";

const rootElement = document.getElementById("react-checkout-gateway-root");

if (rootElement) {
  const actionUrl = rootElement.dataset.actionUrl ?? "/checkout/";
  const rawCsrfToken = rootElement.dataset.csrfToken ?? "";
  const csrfToken =
    rawCsrfToken && rawCsrfToken !== "NOTPROVIDED" ? rawCsrfToken : getCsrfToken();
  const passwordResetUrl = rootElement.dataset.passwordResetUrl ?? "/accounts/password/reset/";
  const initialEmail = rootElement.dataset.initialEmail ?? "";
  const initialOption = rootElement.dataset.initialOption ?? "anonymous";
  const fallbackTargetId = rootElement.dataset.fallbackTargetId;
  const serverError = rootElement.dataset.serverError ?? "";

  createRoot(rootElement).render(
    <StrictMode>
      <GatewayIsland
        actionUrl={actionUrl}
        csrfToken={csrfToken}
        passwordResetUrl={passwordResetUrl}
        initialEmail={initialEmail}
        initialOption={initialOption}
        fallbackTargetId={fallbackTargetId}
        serverError={serverError}
      />
    </StrictMode>,
  );
}

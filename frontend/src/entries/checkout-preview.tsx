import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  PaymentMethodSummaryIsland,
  PlaceOrderIsland,
} from "../features/checkout/components/OrderPreviewIslands";
import "../styles/index.css";

const paymentRoot = document.getElementById("react-preview-payment-method-root");
const placeOrderRoot = document.getElementById("react-preview-place-order-root");

if (paymentRoot) {
  createRoot(paymentRoot).render(
    <StrictMode>
      <PaymentMethodSummaryIsland
        selectedMethod={paymentRoot.dataset.selectedMethod ?? "wompi"}
        changeUrl={paymentRoot.dataset.changeUrl ?? "/checkout/payment-details/#payment-method-end"}
        fallbackTargetId={paymentRoot.dataset.fallbackTargetId}
      />
    </StrictMode>,
  );
}

if (placeOrderRoot) {
  createRoot(placeOrderRoot).render(
    <StrictMode>
      <PlaceOrderIsland
        selectedMethod={placeOrderRoot.dataset.selectedMethod ?? "wompi"}
        changeUrl={placeOrderRoot.dataset.changeUrl ?? "/checkout/payment-details/#payment-method-end"}
        legacyFormId={placeOrderRoot.dataset.legacyFormId ?? "place_order_form"}
        fallbackTargetId={placeOrderRoot.dataset.fallbackTargetId}
      />
    </StrictMode>,
  );
}

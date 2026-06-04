import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ShippingMethodIsland } from "../features/checkout/components/ShippingMethodIsland";
import { getCsrfToken } from "../shared/lib/csrf";
import "../styles/index.css";

type ShippingMethodOption = {
  code: string;
  name: string;
  description: string;
  cost: string;
};

function parseOptions(scriptId: string): ShippingMethodOption[] {
  const source = document.getElementById(scriptId);
  if (!source?.textContent) return [];

  try {
    const parsed = JSON.parse(source.textContent) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
      .map((item) => ({
        code: typeof item.code === "string" ? item.code : "",
        name: typeof item.name === "string" ? item.name : "",
        description: typeof item.description === "string" ? item.description : "",
        cost: typeof item.cost === "string" ? item.cost : "",
      }))
      .filter((item) => item.code && item.name);
  } catch {
    return [];
  }
}

const rootElement = document.getElementById("react-shipping-method-root");

if (rootElement) {
  const actionUrl = rootElement.dataset.actionUrl ?? "/checkout/shipping-method/";
  const rawCsrfToken = rootElement.dataset.csrfToken ?? "";
  const csrfToken =
    rawCsrfToken && rawCsrfToken !== "NOTPROVIDED" ? rawCsrfToken : getCsrfToken();
  const initialCode = rootElement.dataset.initialCode ?? "";
  const fallbackTargetId = rootElement.dataset.fallbackTargetId;
  const optionsScriptId = rootElement.dataset.optionsScriptId ?? "react-shipping-method-data";
  const serverError = rootElement.dataset.serverError ?? "";
  const options = parseOptions(optionsScriptId);

  createRoot(rootElement).render(
    <StrictMode>
      <ShippingMethodIsland
        actionUrl={actionUrl}
        csrfToken={csrfToken}
        initialCode={initialCode}
        options={options}
        fallbackTargetId={fallbackTargetId}
        serverError={serverError}
      />
    </StrictMode>,
  );
}

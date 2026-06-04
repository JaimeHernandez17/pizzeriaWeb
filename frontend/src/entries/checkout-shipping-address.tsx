import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { ShippingAddressIsland } from "../features/checkout/components/ShippingAddressIsland";
import { getCsrfToken } from "../shared/lib/csrf";
import "../styles/index.css";

type CityOption = {
  value: string;
  label: string;
};

type AddressBookItem = {
  id: string;
  lines: string[];
  isDefault: boolean;
  editUrl: string;
  deleteUrl: string;
};

type AddressValues = {
  first_name: string;
  last_name: string;
  line1: string;
  line2: string;
  city: string;
  phone_number: string;
  notes: string;
};

type AddressErrors = Record<string, string[]>;

function parseJsonScript<T>(scriptId: string, fallback: T): T {
  const source = document.getElementById(scriptId);
  if (!source?.textContent) return fallback;
  try {
    return JSON.parse(source.textContent) as T;
  } catch {
    return fallback;
  }
}

const rootElement = document.getElementById("react-shipping-address-root");

if (rootElement) {
  const actionUrl = rootElement.dataset.actionUrl ?? "/checkout/shipping-address/";
  const basketUrl = rootElement.dataset.basketUrl ?? "/basket/";
  const rawCsrfToken = rootElement.dataset.csrfToken ?? "";
  const csrfToken =
    rawCsrfToken && rawCsrfToken !== "NOTPROVIDED" ? rawCsrfToken : getCsrfToken();
  const fallbackTargetId = rootElement.dataset.fallbackTargetId;
  const valuesScriptId = rootElement.dataset.valuesScriptId ?? "react-shipping-address-values";
  const citiesScriptId = rootElement.dataset.citiesScriptId ?? "react-shipping-address-cities";
  const addressesScriptId =
    rootElement.dataset.addressesScriptId ?? "react-shipping-address-addresses";
  const errorsScriptId = rootElement.dataset.errorsScriptId ?? "react-shipping-address-errors";

  const values = parseJsonScript<AddressValues>(valuesScriptId, {
    first_name: "",
    last_name: "",
    line1: "",
    line2: "",
    city: "",
    phone_number: "",
    notes: "",
  });
  const cities = parseJsonScript<CityOption[]>(citiesScriptId, []);
  const addresses = parseJsonScript<AddressBookItem[]>(addressesScriptId, []);
  const errors = parseJsonScript<AddressErrors>(errorsScriptId, {});

  createRoot(rootElement).render(
    <StrictMode>
      <ShippingAddressIsland
        actionUrl={actionUrl}
        basketUrl={basketUrl}
        csrfToken={csrfToken}
        values={values}
        cities={cities}
        addresses={addresses}
        errors={errors}
        fallbackTargetId={fallbackTargetId}
      />
    </StrictMode>,
  );
}

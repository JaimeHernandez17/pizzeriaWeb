import { getCsrfToken } from "../../../shared/lib/csrf";
import { httpGet, httpRequest } from "../../../shared/lib/http";
import type { CartMutationResponse, CartResponse } from "../types";

const CART_BASE = "/api/v1/cart/";

export function fetchCart(apiUrl: string = CART_BASE): Promise<CartResponse> {
  return httpGet<CartResponse>(apiUrl);
}

export function addCartItem(params: {
  productId: number;
  quantity: number;
}): Promise<CartMutationResponse> {
  return httpRequest<CartMutationResponse>("/api/v1/cart/items/", {
    method: "POST",
    headers: {
      "X-CSRFToken": getCsrfToken(),
    },
    body: {
      product_id: params.productId,
      quantity: params.quantity,
    },
  });
}

export function updateCartLine(params: {
  lineId: number;
  quantity: number;
}): Promise<CartMutationResponse> {
  return httpRequest<CartMutationResponse>(`/api/v1/cart/items/${params.lineId}/`, {
    method: "PATCH",
    headers: {
      "X-CSRFToken": getCsrfToken(),
    },
    body: {
      quantity: params.quantity,
    },
  });
}

export function deleteCartLine(lineId: number): Promise<CartMutationResponse> {
  return httpRequest<CartMutationResponse>(`/api/v1/cart/items/${lineId}/`, {
    method: "DELETE",
    headers: {
      "X-CSRFToken": getCsrfToken(),
    },
  });
}

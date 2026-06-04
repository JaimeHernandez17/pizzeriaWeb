import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  addCartItem,
  deleteCartLine,
  fetchCart,
  updateCartLine,
} from "../api/cartApi";

export function useCart(apiUrl?: string) {
  return useQuery({
    queryKey: ["cart", apiUrl ?? "default"],
    queryFn: () => fetchCart(apiUrl),
    staleTime: 10_000,
  });
}

export function useAddCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: addCartItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.dispatchEvent(new CustomEvent("cart-updated"));
    },
  });
}

export function useUpdateCartLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCartLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.dispatchEvent(new CustomEvent("cart-updated"));
    },
  });
}

export function useDeleteCartLine() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCartLine,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      window.dispatchEvent(new CustomEvent("cart-updated"));
    },
  });
}

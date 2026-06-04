export type CartLine = {
  id: number;
  quantity: number;
  product: {
    id: number;
    title: string;
    slug: string;
    url: string;
    image_url: string;
  };
  price: {
    currency: string;
    unit_incl_tax: string;
    line_incl_tax: string;
    line_excl_tax: string;
  };
};

export type CartResponse = {
  id: number | null;
  currency: string;
  num_items: number;
  num_lines: number;
  total_incl_tax: string;
  total_excl_tax: string;
  lines: CartLine[];
};

export type CartMutationResponse = {
  status: "ok" | "error";
  message?: string;
  line_id?: number;
  basket?: CartResponse;
};

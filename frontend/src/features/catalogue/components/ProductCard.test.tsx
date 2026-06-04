import { render, screen } from "@testing-library/react";

import { ProductCard } from "./ProductCard";

describe("ProductCard", () => {
  it("renders product title and price", () => {
    render(
      <ProductCard
        product={{
          id: 1,
          title: "Pizza Margarita",
          slug: "pizza-margarita",
          description: "Tomate, queso y albahaca.",
          url: "/catalogue/pizza-margarita_1/",
          image_url: "",
          price: {
            currency: "COP",
            incl_tax: "35000.00",
            excl_tax: "35000.00",
          },
        }}
      />,
    );

    expect(screen.getByText("Pizza Margarita")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agregar" })).not.toBeInTheDocument();
  });
});

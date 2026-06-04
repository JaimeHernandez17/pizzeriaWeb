import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "localhost",
    port: 5173,
    cors: true,
    strictPort: true,
  },
  build: {
    manifest: "manifest.json",
    outDir: path.resolve(__dirname, "../static/frontend"),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        catalogue: path.resolve(__dirname, "src/entries/catalogue.tsx"),
        productDetail: path.resolve(__dirname, "src/entries/product-detail.tsx"),
        cart: path.resolve(__dirname, "src/entries/cart.tsx"),
        miniBasket: path.resolve(__dirname, "src/entries/mini-basket.tsx"),
        checkoutPaymentMethod: path.resolve(
          __dirname,
          "src/entries/checkout-payment-method.tsx",
        ),
        checkoutPreview: path.resolve(__dirname, "src/entries/checkout-preview.tsx"),
        checkoutShippingMethod: path.resolve(
          __dirname,
          "src/entries/checkout-shipping-method.tsx",
        ),
        checkoutShippingAddress: path.resolve(
          __dirname,
          "src/entries/checkout-shipping-address.tsx",
        ),
        checkoutGateway: path.resolve(__dirname, "src/entries/checkout-gateway.tsx"),
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});

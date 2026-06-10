import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 6101,
    strictPort: true,
    proxy: {
      "/api": {
        target: "http://localhost:6000",
        changeOrigin: true,
      },
    },
  },
});

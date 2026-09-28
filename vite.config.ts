import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Site servi à la racine de son domaine ; build vers dist/ (Cloudflare Pages
  // ou FTP OVH, voir README).
  base: "/",
  define: {
    // Année du build, la même dans le bundle du navigateur et dans celui du
    // prérendu (vite build --ssr) : voir currentYear, src/components/Footer.tsx.
    __BUILD_YEAR__: JSON.stringify(new Date().getFullYear()),
  },
});

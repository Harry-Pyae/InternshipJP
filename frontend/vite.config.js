import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite configuration for the InternshipJP frontend.
//
// The dev server runs on 5173, which is the origin the backend allows through
// CORS (FRONTEND_ORIGIN in the backend configuration). If you change the port
// here, change it there too or the browser will block every request.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
});

import { useEffect } from "react";
import { ensureCsrfToken } from "./api/axiosClient.js";
import AppLayout from "./components/shared/AppLayout.jsx";
import AppRoutes from "./routes/router.jsx";

/**
 * Application shell.
 *
 * The one thing it does on startup is ask the backend for a CSRF cookie. After
 * that every POST/PUT/PATCH/DELETE from Axios carries the matching header
 * automatically. Skipping this step is the usual reason a first login attempt
 * comes back as 403.
 */
export default function App() {
  useEffect(() => {
    ensureCsrfToken();
  }, []);

  return (
    <AppLayout>
      <AppRoutes />
    </AppLayout>
  );
}

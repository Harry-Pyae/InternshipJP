import AppRoutes from "./routes/router.jsx";
import { AuthProvider } from "./config/authContext.jsx";

/**
 * Application shell.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

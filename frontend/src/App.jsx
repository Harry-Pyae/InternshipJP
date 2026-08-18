import AppRoutes from "./routes/router.jsx";
import { AuthProvider } from "./config/authContext.jsx";

/**
 * Application shell.
 *
 * AuthProvider asks the backend once who is signed in, and fetches the CSRF
 * cookie on the way. Every page reads the answer from context rather than
 * asking again.
 *
 * There is no global chrome here on purpose. Signed-in pages get the sidebar
 * and header from RoleLayout; public pages (landing, login, register) bring
 * their own. A single wrapper around both would mean a navbar above the
 * sidebar, which is one navigation too many.
 */
export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

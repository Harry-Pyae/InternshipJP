import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/authApi.js";
import { ensureCsrfToken } from "../api/axiosClient.js";

/**
 * Who is signed in, for the whole application.
 *
 * One place asks the backend "who am I?", and every page reads the answer from
 * here. Without this, each page would ask on mount, which means three requests
 * for one navigation and three chances to disagree about the answer.
 *
 * The session lives in an HttpOnly cookie, so the browser cannot read it. This
 * context is a cache of what the SERVER said, never the source of truth: the
 * backend re-checks the session on every request regardless of what is here.
 * Nothing in this file is a security boundary.
 *
 * Owner: Member 1 (integration). Member 2 extends it for the 2FA challenge.
 */
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch {
      // 401 is the normal answer when nobody is signed in.
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // The CSRF cookie must exist before the first write request. Doing it here
    // means a page can POST as soon as it renders.
    ensureCsrfToken().then(refresh);
  }, [refresh]);

  const signIn = useCallback(async (credentials) => {
    await ensureCsrfToken();
    const signedIn = await authApi.login(credentials);
    setUser(signedIn);
    return signedIn;
  }, []);

  const signOut = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, refresh, signIn, signOut }),
    [user, loading, refresh, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}

/**
 * Where each role goes after signing in.
 *
 * Points at the dashboard rather than the bare role path. Both work - /student
 * redirects to /student/dashboard - but going straight there avoids a visible
 * double navigation.
 */
export function homeFor(role) {
  if (role === "ADMIN") {
    return "/admin/dashboard";
  }
  if (role === "EMPLOYER") {
    return "/employer/dashboard";
  }
  return "/student/dashboard";
}

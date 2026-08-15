import { api } from "./axiosClient.js";

/**
 * The authentication API layer.
 *
 * NOTE FOR MEMBER 2
 *   These are the calls, not the screens. The login, registration and 2FA
 *   pages are yours to design and build - point them at these functions rather
 *   than calling axios from a component, so every feature keeps using one API
 *   layer with one place for the session cookie and CSRF handling.
 *
 *   register/login are here because Member 1 needs them for the developer
 *   session tool on the integration page (see DevSessionPanel). That tool is
 *   scaffolding; your real screens replace it.
 */
export const authApi = {
  /** Resolves with the user, or throws 401 when nobody is signed in. */
  me: () => api.get("/api/auth/me").then((response) => response.data),

  login: ({ email, password }) =>
    api.post("/api/auth/login", { email, password }).then((response) => response.data),

  logout: () => api.post("/api/auth/logout").then((response) => response.data),

  registerStudent: (payload) =>
    api.post("/api/auth/register/student", payload).then((response) => response.data),

  registerEmployer: (payload) =>
    api.post("/api/auth/register/employer", payload).then((response) => response.data),
};

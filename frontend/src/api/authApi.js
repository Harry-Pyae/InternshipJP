import { api } from "./axiosClient.js";

/**
 * The authentication contract, for whoever needs to know who is signed in.
 *
 * NOTE FOR MEMBER 2
 *   These are only the calls the shared layout and the AI pages need. The
 *   login/registration screens are yours to build - add the register and
 *   login calls here rather than calling axios from a component, so every
 *   feature keeps using one API layer.
 */
export const authApi = {
  /** Resolves with the user, or throws 401 when nobody is signed in. */
  me: () => api.get("/api/auth/me").then((response) => response.data),

  logout: () => api.post("/api/auth/logout").then((response) => response.data),
};

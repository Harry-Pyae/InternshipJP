import { api } from "./axiosClient.js";

/**
 * The authentication API layer.
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

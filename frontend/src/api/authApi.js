import { api } from "./axiosClient.js";

/**
 * The authentication API layer.
 */
export const authApi = {
  /** Resolves with the user, or throws 401 when nobody is signed in. */
  /**
   * The signed-in user, or null.
   *
   * The endpoint answers 204 with no body when nobody is signed in, and axios
   * hands that back as an empty string - which is falsy but is not null, and
   * would sit in state looking like a user object that had lost its fields.
   */
  me: () =>
    api.get("/api/auth/me").then((response) => (response.status === 204 ? null : response.data)),

  login: ({ email, password }) =>
    api.post("/api/auth/login", { email, password }).then((response) => response.data),

  logout: () => api.post("/api/auth/logout").then((response) => response.data),

  registerStudent: (payload) =>
    api.post("/api/auth/register/student", payload).then((response) => response.data),

  registerEmployer: (payload) =>
    api.post("/api/auth/register/employer", payload).then((response) => response.data),

  /** Asks for a reset code. Always succeeds, whether the address exists or not. */
  forgotPassword: (email) =>
    api.post("/api/auth/forgot-password", { email }).then((response) => response.data),

  /** Uses the emailed code to set a new password. */
  resetPassword: (payload) =>
    api.post("/api/auth/reset-password", payload).then((response) => response.data),
};

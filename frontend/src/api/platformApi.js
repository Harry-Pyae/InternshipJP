import { api } from "./axiosClient.js";

/**
 * The three integration test endpoints, in the order they should be checked.
 *
 * These are real calls. Nothing here fabricates a successful result: if the
 * backend cannot reach MariaDB, checkDatabase() resolves with
 * connected: false and the reason.
 */
export const platformApi = {
  /** React -> Spring Boot */
  checkHealth: () => api.get("/api/test/health").then((response) => response.data),

  /** Spring Boot -> MariaDB */
  checkDatabase: () => api.get("/api/test/database").then((response) => response.data),

  /** Spring Boot -> Groq */
  checkAi: () => api.get("/api/test/ai").then((response) => response.data),
};

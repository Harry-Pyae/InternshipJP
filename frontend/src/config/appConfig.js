/**
 * Frontend configuration, read once at startup.
 *
 * Anything that differs between a laptop and the deployed site belongs here,
 * so no component ever hard-codes a URL.
 */
export const appConfig = {
  /** Backend base URL. Override with VITE_API_BASE_URL in a .env file. */
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080",

  appName: "InternshipJP",

  /**
   * Routes that exist today. The rest of the map lives in
   * documentation/FRONTEND_OWNERSHIP.md and is built by Members 2, 3 and 4.
   */
  routes: {
    home: "/",
    integrationStatus: "/integration/status",
    studentAi: "/ai/student",
    employerAi: "/ai/employer",
  },
};

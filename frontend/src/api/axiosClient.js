import axios from "axios";
import { appConfig } from "../config/appConfig.js";

/**
 * The single Axios instance the whole application uses.
 *
 * Import this - never call axios directly in a component. Everything that has
 * to be true of every request (session cookie, CSRF header, error shape) is
 * configured once, here.
 *
 * SESSIONS
 *   withCredentials: true sends the INTERNSHIPJP_SESSION cookie. Without it
 *   the backend treats every request as anonymous and returns 401.
 *
 * CSRF
 *   The backend puts a token in the XSRF-TOKEN cookie. Axios reads that cookie
 *   and copies it into the X-XSRF-TOKEN header on POST/PUT/PATCH/DELETE, which
 *   is exactly what Spring Security expects. The cookie only exists after one
 *   GET, so call ensureCsrfToken() before the first write - App.jsx does this
 *   on startup.
 */
export const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
  withCredentials: true,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  // REQUIRED, and easy to miss.
  //
  // Since Axios 1.6.2 the CSRF header is only attached automatically when the
  // request is SAME-ORIGIN. withCredentials alone is not enough. The relevant
  // line inside Axios is:
  //
  //   shouldSendXSRF = withXSRFToken === true
  //                    || (withXSRFToken == null && isURLSameOrigin(url));
  //
  // In development React runs on :5173 and Spring Boot on :8080, which is
  // cross-origin, so without this flag Axios drops the X-XSRF-TOKEN header and
  // every POST/PUT/PATCH/DELETE comes back 403.
  //
  // Safe here because this instance has a fixed baseURL pointing at our own
  // backend, so the token cannot be sent to a third party.
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
  },
  timeout: 40000,
});

/**
 * Asks the backend for a CSRF cookie. Safe to call more than once.
 * Failure is not fatal - the integration page will report the backend as down.
 */
export async function ensureCsrfToken() {
  try {
    await api.get("/api/auth/csrf");
    return true;
  } catch {
    return false;
  }
}

/**
 * Turns any Axios failure into a readable sentence.
 *
 * The backend already returns a predictable body
 * ({ status, error, message, fieldErrors }), so the message it sends is
 * preferred. This helper only invents text when the request never arrived.
 */
export function describeApiError(error) {
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.response?.status === 401) {
    return "Your session has expired. Please sign in again.";
  }
  if (error?.response?.status === 403) {
    return "You do not have permission to do that. If you just restarted the "
      + "backend, reload the page to pick up a fresh security token.";
  }
  if (error?.code === "ECONNABORTED") {
    return "The backend took too long to answer.";
  }
  if (error?.request) {
    return `Could not reach the backend at ${appConfig.apiBaseUrl}. Is Spring Boot running?`;
  }
  return "Something went wrong.";
}

/** Field-level validation messages, or null when there are none. */
export function fieldErrorsOf(error) {
  return error?.response?.data?.fieldErrors ?? null;
}

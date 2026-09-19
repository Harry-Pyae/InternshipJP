import { api } from "./axiosClient.js";

/**
 * Administrator API.
 *
 * Keep all admin HTTP calls here instead of calling Axios directly
 * from admin pages. This follows the existing InternshipJP API pattern.
 */
export const adminApi = {
  // ---------------------------------------------------------------
  // DASHBOARD / USERS
  // ---------------------------------------------------------------

  listUsers: ({
    role = "",
    status = "",
    search = "",
    page = 0,
    size = 20,
  } = {}) =>
    api
      .get("/api/admin/users", {
        params: {
          role: role || undefined,
          status: status || undefined,
          search: search || undefined,
          page,
          size,
        },
      })
      .then((response) => response.data),

  /** One internship, as an administrator sees it. */
  getInternship: (id) =>
    api.get(`/api/admin/internships/${id}`).then((response) => response.data),

  /** Permanent. Suspension is the reversible option and is usually right. */
  deleteUser: (id) =>
    api.delete(`/api/admin/users/${id}`).then((response) => response.data),

  /** Invites another administrator. They set their own password. */
  inviteAdmin: ({ email, fullName }) =>
    api
      .post("/api/admin/invites", { email, fullName })
      .then((response) => response.data),

  /** One account in full, including its role-specific profile. */
  getUser: (id) =>
    api.get(`/api/admin/users/${id}`).then((response) => response.data),

  /**
   * Sends one person a notice.
   *
   * One way: it arrives as a notification and there is no reply channel, because
   * an administrator writing about somebody's account is issuing a notice rather
   * than opening a conversation.
   */
  messageUser: (id, subject, body) =>
    api
      .post(`/api/admin/users/${id}/message`, { subject, body })
      .then((response) => response.data),

  /**
   * Clears a temporary sign-in lock.
   *
   * Separate from account status: a lock expires on its own after fifteen
   * minutes, so this only saves the person waiting. Until now the endpoint
   * existed with no way to reach it, and the only way to clear a lock early
   * was to restart the server.
   */
  unlockSignIn: (id) =>
    api.post(`/api/admin/users/${id}/unlock`).then((response) => response.data),

  /** The reason is required when suspending; the user is shown what it says. */
  updateUserStatus: (id, status, reason) =>
    api
      .patch(`/api/admin/users/${id}/status`, { status, reason })
      .then((response) => response.data),

  // ---------------------------------------------------------------
  // COMPANIES
  // ---------------------------------------------------------------

  listPendingEmployers: ({ page = 0, size = 10 } = {}) =>
    api
      .get("/api/admin/employers/pending", {
        params: { page, size },
      })
      .then((response) => response.data),

  decideEmployer: (id, status, note = "") =>
    api
      .patch(`/api/admin/employers/${id}/approval`, {
        status,
        note,
      })
      .then((response) => response.data),

  // ---------------------------------------------------------------
  // CERTIFICATES
  // ---------------------------------------------------------------

  listPendingCertificates: ({ page = 0, size = 10 } = {}) =>
    api
      .get("/api/admin/certificates/pending", {
        params: { page, size },
      })
      .then((response) => response.data),

  getCertificate: (id) =>
    api
      .get(`/api/admin/certificates/${id}`)
      .then((response) => response.data),

  verifyCertificate: (id, status, note = "") =>
    api
      .patch(`/api/admin/certificates/${id}/verification`, {
        status,
        note,
      })
      .then((response) => response.data),

  /**
   * Returns the actual uploaded certificate file.
   *
   * We request a Blob so the browser can preview PDFs/images.
   */
  getCertificateFile: (id) =>
    api.get(`/api/certificates/${id}/file`, {
      responseType: "blob",
    }),

  // ---------------------------------------------------------------
  // AI USAGE
  // ---------------------------------------------------------------

  getAiUsageSummary: () =>
    api
      .get("/api/admin/ai/usage/summary")
      .then((response) => response.data),

  getAiUsage: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/api/admin/ai/usage", {
        params: { page, size },
      })
      .then((response) => response.data),

  // ---------------------------------------------------------------
  // ADMIN WORKLOAD
  // ---------------------------------------------------------------

  /**
   * Existing backend endpoint.
   *
   * This is calculated from database data and does NOT call the AI provider.
   * It tells the administrator what is waiting and how long it has waited.
   */
  getWorkload: () =>
    api
      .get("/api/ai/admin-workload")
      .then((response) => response.data),

  // ---------------------------------------------------------------
  // ACCOUNT SETTINGS
  // ---------------------------------------------------------------
  //
  // There are none here on purpose. /api/account/** is the same endpoint for
  // every role, and accountApi already wraps it. This file used to carry its
  // own getAccount, updateAccount and changePassword pointing at those exact
  // URLs, so a change to one client silently left the administrator on the
  // other.

  // ---------------------------------------------------------------
  // PLATFORM DATA
  // ---------------------------------------------------------------

  /**
   * The whole database as one JSON file.
   *
   * responseType "blob" because the body is a file, not a payload to read:
   * asking Axios to parse a multi-megabyte backup into JavaScript objects
   * only to serialise it straight back out would double the memory for
   * nothing. The whole response is returned rather than response.data, so the
   * caller can read the filename out of Content-Disposition.
   */
  exportData: () =>
    api.get("/api/admin/data/export", { responseType: "blob" }),

  /** What a compaction would remove. Deletes nothing. */
  previewCompaction: (days) =>
    api
      .get("/api/admin/data/compaction", { params: { days } })
      .then((response) => response.data),

  /** Removes it, and reports what was actually removed. */
  compactData: (days) =>
    api
      .post("/api/admin/data/compaction", null, { params: { days } })
      .then((response) => response.data),

  // ---------------------------------------------------------------
  // INTERNSHIPS
  // ---------------------------------------------------------------

  listInternships: ({ page = 0, size = 20 } = {}) =>
    api
      .get("/api/admin/internships", {
        params: { page, size },
      })
      .then((response) => response.data),
};

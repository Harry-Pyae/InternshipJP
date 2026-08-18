import { api } from "./axiosClient.js";

/**
 * Employer endpoints.
 *
 * NOTE FOR MEMBER 3
 *   This file exists because the employer AI assistant needs to list the
 *   internships you own, so the recruiter can pick one from a dropdown instead
 *   of typing an id. Only that one call is here.
 *
 *   The rest of the employer API is yours - add profile, company, internship
 *   create/update and applicant calls to this file rather than calling axios
 *   from a component. Every endpoint is documented in
 *   documentation/API_CONTRACT.md.
 */
export const employerApi = {
  /** Internships belonging to the signed-in employer's company. */
  listInternships: ({ page = 0, size = 50 } = {}) =>
    api.get("/api/employer/internships", { params: { page, size } }).then((response) => response.data),
};

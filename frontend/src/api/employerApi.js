import { api } from "./axiosClient.js";

/**
 * Employer endpoints.
 */
export const employerApi = {
  /** Internships belonging to the signed-in employer's company. */
  listInternships: ({ page = 0, size = 50 } = {}) =>
    api
      .get("/api/employer/internships", { params: { page, size } })
      .then((response) => response.data),

  /** Create an internship for the signed-in employer's company. */
  createInternship: (data) =>
    api
      .post("/api/employer/internships", data)
      .then((response) => response.data),

  /** One internship the signed-in employer's company owns. */
  getInternship: (id) =>
    api.get(`/api/employer/internships/${id}`).then((response) => response.data),

  /** Update an internship. Publishing needs the company to be approved. */
  updateInternship: (id, data) =>
    api.put(`/api/employer/internships/${id}`, data).then((response) => response.data),

  /** Get the signed-in employer's company profile. */
  getCompany: () =>
    api
      .get("/api/employer/company")
      .then((response) => response.data),
  /** Get real dashboard statistics for the signed-in employer. */
  getDashboard: () =>
    api
      .get("/api/employer/dashboard")
      .then((response) => response.data),
  /** List applications for one of the employer's internships. */
  listApplications: ({ internshipId, page = 0, size = 50 }) =>
    api
      .get(`/api/employer/internships/${internshipId}/applications`, {
        params: { page, size },
      })
      .then((response) => response.data),

  /** Get the full details of one application. */
  getApplication: (id) =>
    api
      .get(`/api/employer/applications/${id}`)
      .then((response) => response.data),

  /** Update an application's review status. */
  updateApplicationStatus: (id, data) =>
    api
      .patch(`/api/employer/applications/${id}/status`, data)
      .then((response) => response.data),

  /** Update the signed-in employer's company profile. */
  updateCompany: (data) =>
    api
      .put("/api/employer/company", data)
      .then((response) => response.data),
  /** Get the signed-in employer's profile. */
  getProfile: () =>
    api
      .get("/api/employer/profile")
      .then((response) => response.data),

  /** Update the signed-in employer's profile. */
  updateProfile: (data) =>
    api
      .put("/api/employer/profile", data)
      .then((response) => response.data),

  /** One application, with the student's profile, skills and certificates. */
  getApplication: (id) =>
    api.get(`/api/employer/applications/${id}`).then((response) => response.data),

  /** Move an application through the pipeline. */
  setApplicationStatus: (id, status, note = "") =>
    api
      .patch(`/api/employer/applications/${id}/status`, { status, note })
      .then((response) => response.data),

  /**
   * Ask the applicant for something. Delivered as a notification, which the
   * student already has a page for - so this needed no new delivery mechanism.
   */
  messageApplicant: (id, message) =>
    api
      .post(`/api/employer/applications/${id}/message`, { message })
      .then((response) => response.data),
};
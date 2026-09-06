import { api } from "./axiosClient.js";

/**
 * API calls belonging to the signed-in student.
 *
 * The backend identifies the student from the session, so these
 * endpoints intentionally use /me rather than a student ID.
 */
export const studentApi = {
  // Profile
  getProfile: () =>
    api.get("/api/students/me").then((response) => response.data),

  updateProfile: (profile) =>
    api.put("/api/students/me", profile).then((response) => response.data),

  // Skills
  listSkills: () =>
    api.get("/api/students/me/skills").then((response) => response.data),

  addSkill: (skill) =>
    api.post("/api/students/me/skills", skill).then((response) => response.data),

  updateSkill: (id, skill) =>
    api
      .put(`/api/students/me/skills/${id}`, skill)
      .then((response) => response.data),

  deleteSkill: (id) =>
    api
      .delete(`/api/students/me/skills/${id}`)
      .then((response) => response.data),

  // Education
  listEducation: () =>
    api
      .get("/api/students/me/education")
      .then((response) => response.data),

  addEducation: (education) =>
    api
      .post("/api/students/me/education", education)
      .then((response) => response.data),

  updateEducation: (id, education) =>
    api
      .put(`/api/students/me/education/${id}`, education)
      .then((response) => response.data),

  deleteEducation: (id) =>
    api
      .delete(`/api/students/me/education/${id}`)
      .then((response) => response.data),
  
    // Applications
  listApplications: ({ page = 0, size = 10 } = {}) =>
    api
      .get("/api/student/applications", {
        params: { page, size },
      })
      .then((response) => response.data),
  
    getCertificates() {
    return api.get("/api/students/me/certificates");
  },

  uploadCertificate(formData) {
    return api.post("/api/students/me/certificates", formData);
  },

  deleteCertificate(id) {
    return api.delete(`/api/students/me/certificates/${id}`);
  },

  getCertificateFile(id) {
    return api.get(`/api/certificates/${id}/file`, {
      responseType: "blob",
    });
  },


  /**
   * Open vacancies, for the Browse internships page (Member 3).
   *
   * Restored after the student branch replaced this file - her copy predated
   * that page, so merging it wholesale removed the one call Browse depends on.
   */
  listInternships: ({ page = 0, size = 20, keyword = "" } = {}) =>
    api
      .get("/api/internships", { params: { page, size, keyword } })
      .then((response) => response.data),

  /** One vacancy, for the detail page. */
  getInternship: (id) =>
    api.get(`/api/internships/${id}`).then((response) => response.data),

  /**
   * Apply to an internship.
   *
   * The endpoint existed from the start; nothing in the interface called it,
   * so a student could browse and never apply. The backend rejects a second
   * application to the same vacancy, which is where the 409 below comes from.
   */
  apply: (internshipId, coverLetter = "") =>
    api
      .post(`/api/internships/${internshipId}/applications`, { coverLetter })
      .then((response) => response.data),
};
import { api } from "./axiosClient.js";

/**
 * The AI assistant endpoints. Member 1's area.
 *
 * The backend answers with { conversationId, answer, model, degraded }.
 * When degraded is true the answer explains why (no API key, provider down,
 * or not enough profile data yet) - show it as a normal message with a hint,
 * not as an error.
 */
export const aiApi = {
  studentChat: ({ message, conversationId }) =>
    api
      .post("/api/ai/student-chat", { message, conversationId })
      .then((response) => response.data),

  employerChat: ({ message, conversationId, internshipId }) =>
    api
      .post("/api/ai/employer-chat", { message, conversationId, internshipId })
      .then((response) => response.data),

  conversations: () => api.get("/api/ai/conversations").then((response) => response.data),

  messages: (conversationId) =>
    api.get(`/api/ai/conversations/${conversationId}/messages`).then((response) => response.data),

  deleteConversation: (conversationId) =>
    api.delete(`/api/ai/conversations/${conversationId}`).then((response) => response.data),

  /**
   * Internship matches with the reasoning attached.
   *
   * This one makes no AI provider call - the backend calculates the score by
   * comparing skills. It works with no API key, so it is the part of the AI
   * area that is always available.
   */
  recommendations: (limit = 5) =>
    api.get("/api/ai/recommendations", { params: { limit } }).then((response) => response.data),

  /**
   * Student: what to learn next and what is missing from the profile.
   * Counted from the database - no provider call, so it always works.
   */
  skillGaps: (language = "en") =>
    api.get("/api/ai/skill-gaps", { params: { language } }).then((response) => response.data),

  /**
   * Employer: what this company is missing - weak listings, unreviewed
   * applicants, and required skills almost no student has.
   */
  companyInsights: (language = "en") =>
    api
      .get("/api/ai/company-insights", { params: { language } })
      .then((response) => response.data),

  adminChat: ({ message, conversationId }) =>
    api.post("/api/ai/admin-chat", { message, conversationId }).then((response) => response.data),

  /**
   * Admin: what is waiting for review, and how long it has waited.
   * Calculated - no provider call.
   */
  adminWorkload: (language = "en") =>
    api
      .get("/api/ai/admin-workload", { params: { language } })
      .then((response) => response.data),
};

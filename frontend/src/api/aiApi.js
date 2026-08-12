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
};

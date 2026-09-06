import { api } from "./axiosClient.js";

/**
 * The account endpoints every role shares: your own details, your password,
 * and your password.
 */
export const accountApi = {
  me: () => api.get("/api/account/me").then((response) => response.data),

  update: (data) => api.put("/api/account/me", data).then((response) => response.data),

  changePassword: (data) =>
    api.post("/api/account/change-password", data).then((response) => response.data),
};

/** Notifications, shared by all three roles. Owner: Member 4. */
export const notificationApi = {
  list: ({ page = 0, size = 20 } = {}) =>
    api.get("/api/notifications", { params: { page, size } }).then((response) => response.data),

  markRead: (id) =>
    api.patch(`/api/notifications/${id}/read`).then((response) => response.data),

  /** Just the number, for the bell. Cheap enough to poll. */
  unreadCount: () =>
    api.get("/api/notifications/unread-count").then((response) => response.data),

  markAllRead: () => api.patch("/api/notifications/read-all").then((response) => response.data),
};

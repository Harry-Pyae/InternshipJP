import { api } from "./axiosClient.js";

/**
 * The account endpoints every role shares: your own details, your password,
 * and the feedback form.
 */
export const accountApi = {
  me: () => api.get("/api/account/me").then((response) => response.data),

  update: (data) => api.put("/api/account/me", data).then((response) => response.data),

  /** Uploads or replaces the caller's own profile photo. */
  uploadPhoto: (file) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post("/api/account/photo", form)
      .then((response) => response.data);
  },

  /** Removes the caller's own photo. */
  removePhoto: () =>
    api.delete("/api/account/photo").then((response) => response.data),

  /**
   * Fetches somebody's photo as a blob URL, or null when they have none.
   *
   * Not an <img src> pointing at the endpoint: the API is on a different
   * origin in development, and a cross-origin image request does not carry
   * the session cookie, so it would come back 401 every time. Going through
   * the configured client keeps the credentials and the CSRF handling.
   */
  fetchPhoto: (userId, version = 0) =>
    api
      // The endpoint sets a ten-minute cache header, which is right for an
      // avatar that appears on every row of every table. It also means a
      // refetch after a change is answered from the browser cache with the old
      // image - which is why removing a photo appeared to do nothing. The
      // version makes the address different, so a change is always fetched.
      .get(`/api/account/photo/${userId}`, { responseType: "blob", params: { v: version } })
      .then((response) => URL.createObjectURL(response.data))
      .catch(() => null),

  changePassword: (data) =>
    api.post("/api/account/change-password", data).then((response) => response.data),

  /** Feedback reaches administrators as a notification - see FeedbackController. */
  /** Deletes the caller's own account. Permanent. */
  deleteMyAccount: (password) =>
    api.delete("/api/account/me", { data: { password } }).then((response) => response.data),

  sendFeedback: (message) =>
    api.post("/api/feedback", { message }).then((response) => response.data),
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

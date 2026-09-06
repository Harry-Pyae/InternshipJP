import { api } from "./axiosClient.js";

export const twoFactorApi = {
  getStatus: () =>
    api.get("/api/account/2fa/status").then((response) => response.data),

  setupTotp: () =>
    api.post("/api/account/2fa/totp/setup").then((response) => response.data),

  verifyTotp: (code) =>
    api
      .post("/api/account/2fa/totp/verify", { code })
      .then((response) => response.data),

  disableTotp: () =>
    api
      .post("/api/account/2fa/totp/disable")
      .then((response) => response.data),

  sendEmailOtp: () =>
    api
      .post("/api/account/2fa/email/send")
      .then((response) => response.data),

  verifyEmailOtp: (code) =>
    api
      .post("/api/account/2fa/email/verify", { code })
      .then((response) => response.data),

  disableEmailOtp: () =>
    api
      .post("/api/account/2fa/email/disable")
      .then((response) => response.data),
};
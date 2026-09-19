import { api } from "./axiosClient.js";

/**
 * The two-factor endpoints. NOT REACHED BY ANY SCREEN YET.
 *
 * Every call below works and is covered by TotpServiceTest, and the tables
 * behind them (user_two_factor_settings, email_otp_challenges) are in the
 * schema. What is missing is the half that makes them matter: sign-in does not
 * present a challenge, so enrolling would protect nobody.
 *
 * That is why there is deliberately no settings screen for this. A switch
 * labelled "two-factor authentication" that does not change what happens at
 * sign-in is worse than no switch at all - somebody would turn it on and
 * believe they were protected.
 *
 * To finish it, both halves have to land together: the enrolment screen here,
 * and the challenge in AuthService.authenticate(), which has a note at the
 * exact line it belongs on.
 */
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
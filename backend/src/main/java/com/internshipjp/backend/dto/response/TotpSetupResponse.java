package com.internshipjp.backend.dto.response;


/**
 * POST /api/account/2fa/totp/setup
 *
 * The secret is shown exactly once, so the user can add it to their
 * authenticator app. It is never written to the log.
 */
public class TotpSetupResponse {
    private String secret;

    private String otpAuthUri;

    private String issuer;

    private String accountName;

    public String getSecret() {
        return secret;
    }

    public void setSecret(String secret) {
        this.secret = secret;
    }

    public String getOtpAuthUri() {
        return otpAuthUri;
    }

    public void setOtpAuthUri(String otpAuthUri) {
        this.otpAuthUri = otpAuthUri;
    }

    public String getIssuer() {
        return issuer;
    }

    public void setIssuer(String issuer) {
        this.issuer = issuer;
    }

    public String getAccountName() {
        return accountName;
    }

    public void setAccountName(String accountName) {
        this.accountName = accountName;
    }
}

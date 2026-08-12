package com.internshipjp.backend.dto.response;


/**
 * GET /api/account/2fa/status
 */
public class TwoFactorStatusResponse {
    private boolean totpEnabled;

    private boolean emailOtpEnabled;

    private String preferredMethod;

    private boolean totpAvailable;

    public boolean isTotpEnabled() {
        return totpEnabled;
    }

    public void setTotpEnabled(boolean totpEnabled) {
        this.totpEnabled = totpEnabled;
    }

    public boolean isEmailOtpEnabled() {
        return emailOtpEnabled;
    }

    public void setEmailOtpEnabled(boolean emailOtpEnabled) {
        this.emailOtpEnabled = emailOtpEnabled;
    }

    public String getPreferredMethod() {
        return preferredMethod;
    }

    public void setPreferredMethod(String preferredMethod) {
        this.preferredMethod = preferredMethod;
    }

    public boolean isTotpAvailable() {
        return totpAvailable;
    }

    public void setTotpAvailable(boolean totpAvailable) {
        this.totpAvailable = totpAvailable;
    }
}

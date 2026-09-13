package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Accepting an administrator invitation: the code, and a password of your own. */
public class AcceptInviteRequest {

    @NotBlank(message = "Enter the email address the invitation was sent to.")
    private String email;

    @NotBlank(message = "Enter the code from the invitation.")
    private String code;

    @NotBlank(message = "Choose a password.")
    @Size(min = 8, message = "Use at least 8 characters.")
    private String newPassword;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getNewPassword() {
        return newPassword;
    }

    public void setNewPassword(String newPassword) {
        this.newPassword = newPassword;
    }
}

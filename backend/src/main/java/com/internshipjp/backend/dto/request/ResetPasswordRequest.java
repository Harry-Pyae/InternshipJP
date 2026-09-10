package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Uses the emailed code to set a new password. */
public class ResetPasswordRequest {

    @NotBlank
    @Email
    private String email;

    @NotBlank(message = "Enter the code from the email.")
    @Size(min = 4, max = 10)
    private String code;

    @NotBlank
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
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

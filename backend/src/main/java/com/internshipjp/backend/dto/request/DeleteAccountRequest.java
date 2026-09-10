package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;

/**
 * Confirms a self-service account deletion.
 *
 * The password is required rather than a checkbox: deletion is permanent, and
 * an unlocked computer should not be enough to destroy someone's applications
 * and verified certificates.
 */
public class DeleteAccountRequest {

    @NotBlank(message = "Enter your password to confirm.")
    private String password;

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }
}

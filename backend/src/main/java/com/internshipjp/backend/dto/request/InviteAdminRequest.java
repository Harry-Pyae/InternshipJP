package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** One administrator inviting another. No password: the invitee sets their own. */
public class InviteAdminRequest {

    @NotBlank(message = "Enter the email address to invite.")
    @Email(message = "Enter a valid email address.")
    @Size(max = 190)
    private String email;

    @NotBlank(message = "Enter the person's name.")
    @Size(max = 150)
    private String fullName;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }
}

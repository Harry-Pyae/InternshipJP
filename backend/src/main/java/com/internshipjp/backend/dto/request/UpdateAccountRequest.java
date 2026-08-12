package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Editable fields shared by all three roles (PUT /api/account/me).
 */
public class UpdateAccountRequest {
    @NotBlank
    @Size(max = 150)
    private String fullName;

    @Size(max = 30)
    private String phone;

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }
}

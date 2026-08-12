package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Administrator suspend / reactivate.
 */
public class UpdateUserStatusRequest {
    @NotBlank
    @Pattern(regexp = "ACTIVE|SUSPENDED|PENDING", message = "status must be ACTIVE, SUSPENDED or PENDING")
    private String status;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

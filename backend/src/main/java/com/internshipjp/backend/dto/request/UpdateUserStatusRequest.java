package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Administrator suspend / reactivate.
 */
public class UpdateUserStatusRequest {
    @NotBlank
    @Pattern(regexp = "ACTIVE|SUSPENDED|PENDING", message = "status must be ACTIVE, SUSPENDED or PENDING")
    private String status;

    /**
     * Why. Required when suspending, ignored otherwise.
     *
     * An application status change already carried a note and a certificate
     * rejection already required a written reason; suspending a person's whole
     * account carried nothing, which was the heaviest of the three.
     */
    @Size(max = 500, message = "Keep the reason under 500 characters.")
    private String reason;

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Administrator decision on a certificate.
 */
public class CertificateVerificationRequest {
    @NotBlank
    @Pattern(regexp = "VERIFIED|REJECTED", message = "status must be VERIFIED or REJECTED")
    private String status;

    @Size(max = 500)
    private String note;

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getNote() {
        return note;
    }

    public void setNote(String note) {
        this.note = note;
    }
}

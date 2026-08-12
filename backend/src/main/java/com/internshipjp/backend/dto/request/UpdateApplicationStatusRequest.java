package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Employer decision on one application.
 */
public class UpdateApplicationStatusRequest {
    @NotBlank
    @Pattern(regexp = "UNDER_REVIEW|SHORTLISTED|INTERVIEW|ACCEPTED|REJECTED", message = "Employers may set UNDER_REVIEW, SHORTLISTED, INTERVIEW, ACCEPTED or REJECTED")
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

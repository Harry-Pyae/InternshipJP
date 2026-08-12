package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Administrator decision on a company.
 */
public class CompanyApprovalRequest {
    @NotBlank
    @Pattern(regexp = "APPROVED|REJECTED|MORE_INFO_REQUIRED", message = "status must be APPROVED, REJECTED or MORE_INFO_REQUIRED")
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

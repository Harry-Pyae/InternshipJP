package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Certificate metadata sent alongside the uploaded file.
 * The file itself arrives as a separate multipart part named "file".
 */
public class CertificateUploadRequest {
    @NotBlank
    @Size(max = 200)
    private String title;

    @Size(max = 200)
    private String issuingOrganization;

    private LocalDate issueDate;

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getIssuingOrganization() {
        return issuingOrganization;
    }

    public void setIssuingOrganization(String issuingOrganization) {
        this.issuingOrganization = issuingOrganization;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }
}

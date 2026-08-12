package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Size;

/**
 * Apply to an internship.
 */
public class CreateApplicationRequest {
    @Size(max = 3000)
    private String coverLetter;

    private Long resumeId;

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }

    public Long getResumeId() {
        return resumeId;
    }

    public void setResumeId(Long resumeId) {
        this.resumeId = resumeId;
    }
}

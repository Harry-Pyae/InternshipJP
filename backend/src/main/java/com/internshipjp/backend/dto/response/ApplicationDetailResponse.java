package com.internshipjp.backend.dto.response;

import java.util.List;

/**
 * Full application as seen by the reviewing employer.
 *
 * verifiedCertificates contains VERIFIED certificates only - the filtering
 * happens in CertificateService, never in the browser.
 */
public class ApplicationDetailResponse {
    private Long id;

    private String status;

    private String coverLetter;

    private String createdAt;

    private String updatedAt;

    private InternshipSummaryResponse internship;

    private StudentProfileResponse student;

    private List<StudentSkillResponse> skills;

    private List<CertificateResponse> verifiedCertificates;

    private List<ApplicationStatusHistoryResponse> statusHistory;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getCoverLetter() {
        return coverLetter;
    }

    public void setCoverLetter(String coverLetter) {
        this.coverLetter = coverLetter;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public String getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(String updatedAt) {
        this.updatedAt = updatedAt;
    }

    public InternshipSummaryResponse getInternship() {
        return internship;
    }

    public void setInternship(InternshipSummaryResponse internship) {
        this.internship = internship;
    }

    public StudentProfileResponse getStudent() {
        return student;
    }

    public void setStudent(StudentProfileResponse student) {
        this.student = student;
    }

    public List<StudentSkillResponse> getSkills() {
        return skills;
    }

    public void setSkills(List<StudentSkillResponse> skills) {
        this.skills = skills;
    }

    public List<CertificateResponse> getVerifiedCertificates() {
        return verifiedCertificates;
    }

    public void setVerifiedCertificates(List<CertificateResponse> verifiedCertificates) {
        this.verifiedCertificates = verifiedCertificates;
    }

    public List<ApplicationStatusHistoryResponse> getStatusHistory() {
        return statusHistory;
    }

    public void setStatusHistory(List<ApplicationStatusHistoryResponse> statusHistory) {
        this.statusHistory = statusHistory;
    }
}

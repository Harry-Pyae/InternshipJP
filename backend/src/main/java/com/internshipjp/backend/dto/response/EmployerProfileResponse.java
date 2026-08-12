package com.internshipjp.backend.dto.response;


/**
 * Recruiter details plus the company they belong to.
 */
public class EmployerProfileResponse {
    private Long id;

    private String fullName;

    private String email;

    private String jobTitle;

    private String workEmail;

    private String contactPhone;

    private CompanyResponse company;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }

    public String getWorkEmail() {
        return workEmail;
    }

    public void setWorkEmail(String workEmail) {
        this.workEmail = workEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public CompanyResponse getCompany() {
        return company;
    }

    public void setCompany(CompanyResponse company) {
        this.company = company;
    }
}

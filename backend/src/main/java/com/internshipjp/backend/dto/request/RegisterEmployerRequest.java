package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Employer self-registration payload.
 * Creates the user, the company and the employer profile in one transaction.
 */
public class RegisterEmployerRequest {
    @NotBlank
    @Email
    @Size(max = 190)
    private String email;

    @NotBlank
    @Size(min = 8, max = 100, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank
    @Size(max = 150)
    private String fullName;

    @NotBlank
    @Size(max = 150)
    private String companyName;

    @Size(max = 100)
    private String industry;

    @Size(max = 255)
    private String website;

    @Size(max = 120)
    private String jobTitle;

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getCompanyName() {
        return companyName;
    }

    public void setCompanyName(String companyName) {
        this.companyName = companyName;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getJobTitle() {
        return jobTitle;
    }

    public void setJobTitle(String jobTitle) {
        this.jobTitle = jobTitle;
    }
}

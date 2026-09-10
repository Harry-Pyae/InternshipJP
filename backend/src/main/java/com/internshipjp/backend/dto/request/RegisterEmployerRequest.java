package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
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

    /**
     * Required, unlike the rest.
     *
     * An administrator is being asked to approve a real business. Without a
     * registration number there is nothing to check the company against, and
     * the review page could only show the name someone typed - which is how a
     * company ended up registered as a person's name.
     */
    @NotBlank(message = "A business registration number is required so an administrator can verify the company.")
    @Size(max = 100)
    private String registrationNumber;

    /**
     * Required for the same reason. A free webmail address proves nothing, but
     * an address an administrator can write to is the minimum for a decision.
     */
    @NotBlank(message = "A contact email is required.")
    @Email(message = "Enter a valid contact email.")
    @Size(max = 190)
    private String contactEmail;

    @NotBlank(message = "Country is required.")
    @Size(max = 100)
    private String country;

    @NotBlank(message = "City is required.")
    @Size(max = 120)
    private String location;

    @Size(max = 255)
    private String address;

    @Size(max = 255)
    private String linkedinUrl;

    @Size(max = 30)
    private String contactPhone;

    @Size(max = 30)
    private String companySize;

    /**
     * Integer, not text: the column is INT, and Jackson coerces "2019" for us.
     * An empty field is omitted by the form rather than sent as "", which would
     * fail to coerce.
     */
    @Min(value = 1800, message = "Enter a four-digit year.")
    @Max(value = 2100, message = "Enter a four-digit year.")
    private Integer foundedYear;

    @Size(max = 1500)
    private String description;

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

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getCompanySize() {
        return companySize;
    }

    public void setCompanySize(String companySize) {
        this.companySize = companySize;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getFoundedYear() {
        return foundedYear;
    }

    public void setFoundedYear(Integer foundedYear) {
        this.foundedYear = foundedYear;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }
}

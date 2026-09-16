package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Pattern;

/**
 * Employer edit of their own company.
 * Future work: the edit form for these fields is not yet built.
 */
public class UpdateCompanyRequest {
    @NotBlank
    @Size(max = 150)
    private String name;

    @Size(max = 100)
    private String industry;

    @Size(max = 30)
    private String companySize;

    @Min(1800)
    @Max(2100)
    private Integer foundedYear;

    @Size(max = 20, message = "A registration number is at most 20 characters.")
    private String registrationNumber;

    @Size(max = 255)
    private String website;

    @Email
    @Size(max = 190)
    private String contactEmail;

    @Size(max = 30)
    /**
     * An international number, written the way it is dialled from abroad.
     *
     * NOT FIXED TO +95, AND THE REASON MATTERS
     *   Registration asks for a country. Enforcing a Myanmar dialling code
     *   while offering that choice contradicts it: somebody who selects
     *   Thailand and types a Thai number would be told their own number is
     *   wrong. The pattern follows the form rather than the other way round.
     *
     * A plus, then a country code that does not start with zero, then seven
     * to fourteen digits - the E.164 shape. A Myanmar number written
     * +959 7xx xxx xxx satisfies it, which is the common case here.
     *
     * Optional: an empty field is allowed, an ill-formed one is not.
     */
    // E.164 allows fifteen digits after the plus, so sixteen characters is
    // the real ceiling. A Myanmar number is thirteen of them; capping at
    // thirteen would refuse a longer number that is perfectly valid.
    @Size(max = 16, message = "A phone number is at most 16 characters.")
    @Pattern(regexp = "^$|^\\+[1-9][0-9]{6,14}$",
             message = "Use the international form, starting with + and the country code.")
    private String contactPhone;

    @Size(max = 255)
    private String linkedinUrl;

    @Size(max = 150)
    private String location;

    @Size(max = 255)
    private String address;

    @Size(max = 100)
    private String country;

    @Size(max = 1500)
    private String description;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getIndustry() {
        return industry;
    }

    public void setIndustry(String industry) {
        this.industry = industry;
    }

    public String getCompanySize() {
        return companySize;
    }

    public void setCompanySize(String companySize) {
        this.companySize = companySize;
    }

    public Integer getFoundedYear() {
        return foundedYear;
    }

    public void setFoundedYear(Integer foundedYear) {
        this.foundedYear = foundedYear;
    }

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public String getWebsite() {
        return website;
    }

    public void setWebsite(String website) {
        this.website = website;
    }

    public String getContactEmail() {
        return contactEmail;
    }

    public void setContactEmail(String contactEmail) {
        this.contactEmail = contactEmail;
    }

    public String getContactPhone() {
        return contactPhone;
    }

    public void setContactPhone(String contactPhone) {
        this.contactPhone = contactPhone;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }
}

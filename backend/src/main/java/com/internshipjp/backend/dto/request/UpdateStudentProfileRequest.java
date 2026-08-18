package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

/**
 * Student profile edit.
 *
 * Note what is NOT here: age. The client sends dateOfBirth and the server
 * derives the age, so it can never go stale.
 * TODO MEMBER_2: extend with education entries and richer validation.
 */
public class UpdateStudentProfileRequest {
    @Size(max = 150)
    private String headline;

    private LocalDate dateOfBirth;

    private Boolean currentlyAttending;

    @Size(max = 100)
    private String country;

    @Size(max = 255)
    private String githubUrl;

    @Pattern(regexp = "ONSITE|REMOTE|HYBRID", message = "preferredWorkMode must be ONSITE, REMOTE or HYBRID")
    private String preferredWorkMode;

    private LocalDate availableFrom;

    @Size(max = 150)
    private String university;

    @Size(max = 150)
    private String degree;

    @Size(max = 150)
    private String fieldOfStudy;

    @Min(1950)
    @Max(2100)
    private Integer graduationYear;

    @Size(max = 1500)
    private String biography;

    @Size(max = 150)
    private String location;

    @Size(max = 50)
    private String availability;

    @Size(max = 255)
    private String portfolioUrl;

    @Size(max = 255)
    private String linkedinUrl;

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public Boolean getCurrentlyAttending() {
        return currentlyAttending;
    }

    public void setCurrentlyAttending(Boolean currentlyAttending) {
        this.currentlyAttending = currentlyAttending;
    }

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public String getPreferredWorkMode() {
        return preferredWorkMode;
    }

    public void setPreferredWorkMode(String preferredWorkMode) {
        this.preferredWorkMode = preferredWorkMode;
    }

    public LocalDate getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalDate availableFrom) {
        this.availableFrom = availableFrom;
    }

    public String getUniversity() {
        return university;
    }

    public void setUniversity(String university) {
        this.university = university;
    }

    public String getDegree() {
        return degree;
    }

    public void setDegree(String degree) {
        this.degree = degree;
    }

    public String getFieldOfStudy() {
        return fieldOfStudy;
    }

    public void setFieldOfStudy(String fieldOfStudy) {
        this.fieldOfStudy = fieldOfStudy;
    }

    public Integer getGraduationYear() {
        return graduationYear;
    }

    public void setGraduationYear(Integer graduationYear) {
        this.graduationYear = graduationYear;
    }

    public String getBiography() {
        return biography;
    }

    public void setBiography(String biography) {
        this.biography = biography;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public String getPortfolioUrl() {
        return portfolioUrl;
    }

    public void setPortfolioUrl(String portfolioUrl) {
        this.portfolioUrl = portfolioUrl;
    }

    public String getLinkedinUrl() {
        return linkedinUrl;
    }

    public void setLinkedinUrl(String linkedinUrl) {
        this.linkedinUrl = linkedinUrl;
    }
}

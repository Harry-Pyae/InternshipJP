package com.internshipjp.backend.entity;

import jakarta.persistence.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * The professional profile of one student. Education, skills, interests,
 * resumes, certificates and applications all point at this row.
 * Owner: Member 2.
 */
@Entity
@Table(name = "student_profiles")
public class StudentProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // One line under the name, e.g. "Third-year CS student, backend and databases".
    @Column(name = "headline", length = 150)
    private String headline;

    @Column(name = "university", length = 150)
    private String university;

    @Column(name = "degree", length = 150)
    private String degree;

    @Column(name = "field_of_study", length = 150)
    private String fieldOfStudy;

    // Expected year when currentlyAttending is true, otherwise the year finished.
    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "currently_attending", nullable = false)
    private boolean currentlyAttending;

    // Stored instead of age, which would be wrong the day after saving.
    // StudentMapper derives the age from this whenever it is needed.
    @Column(name = "date_of_birth")
    private LocalDate dateOfBirth;

    @Column(name = "biography", length = 1500)
    private String biography;

    // City. Paired with country below.
    @Column(name = "location", length = 150)
    private String location;

    @Column(name = "country", length = 100)
    private String country;

    @Column(name = "availability", length = 50)
    private String availability;

    @Enumerated(EnumType.STRING)
    @Column(name = "preferred_work_mode", length = 20)
    private WorkMode preferredWorkMode;

    @Column(name = "available_from")
    private LocalDate availableFrom;

    @Column(name = "portfolio_url", length = 255)
    private String portfolioUrl;

    @Column(name = "linkedin_url", length = 255)
    private String linkedinUrl;

    @Column(name = "github_url", length = 255)
    private String githubUrl;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (this.createdAt == null) {
            this.createdAt = now;
        }
        this.updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public String getHeadline() {
        return headline;
    }

    public void setHeadline(String headline) {
        this.headline = headline;
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

    public boolean isCurrentlyAttending() {
        return currentlyAttending;
    }

    public void setCurrentlyAttending(boolean currentlyAttending) {
        this.currentlyAttending = currentlyAttending;
    }

    public LocalDate getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(LocalDate dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
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

    public String getCountry() {
        return country;
    }

    public void setCountry(String country) {
        this.country = country;
    }

    public String getAvailability() {
        return availability;
    }

    public void setAvailability(String availability) {
        this.availability = availability;
    }

    public WorkMode getPreferredWorkMode() {
        return preferredWorkMode;
    }

    public void setPreferredWorkMode(WorkMode preferredWorkMode) {
        this.preferredWorkMode = preferredWorkMode;
    }

    public LocalDate getAvailableFrom() {
        return availableFrom;
    }

    public void setAvailableFrom(LocalDate availableFrom) {
        this.availableFrom = availableFrom;
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

    public String getGithubUrl() {
        return githubUrl;
    }

    public void setGithubUrl(String githubUrl) {
        this.githubUrl = githubUrl;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

}

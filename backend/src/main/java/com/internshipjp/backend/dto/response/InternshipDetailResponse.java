package com.internshipjp.backend.dto.response;

import java.math.BigDecimal;
import java.util.List;

/**
 * Full internship record.
 */
public class InternshipDetailResponse {
    private Long id;

    private String title;

    private String description;

    private String responsibilities;

    private String requirements;

    private String location;

    private String workMode;

    private Integer durationMonths;

    private BigDecimal stipendAmount;

    private String stipendCurrency;

    private Integer availablePositions;

    private String applicationDeadline;

    private String status;

    private String publishedAt;

    private String createdAt;

    private CompanyResponse company;

    private List<String> requiredSkills;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getResponsibilities() {
        return responsibilities;
    }

    public void setResponsibilities(String responsibilities) {
        this.responsibilities = responsibilities;
    }

    public String getRequirements() {
        return requirements;
    }

    public void setRequirements(String requirements) {
        this.requirements = requirements;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getWorkMode() {
        return workMode;
    }

    public void setWorkMode(String workMode) {
        this.workMode = workMode;
    }

    public Integer getDurationMonths() {
        return durationMonths;
    }

    public void setDurationMonths(Integer durationMonths) {
        this.durationMonths = durationMonths;
    }

    public BigDecimal getStipendAmount() {
        return stipendAmount;
    }

    public void setStipendAmount(BigDecimal stipendAmount) {
        this.stipendAmount = stipendAmount;
    }

    public String getStipendCurrency() {
        return stipendCurrency;
    }

    public void setStipendCurrency(String stipendCurrency) {
        this.stipendCurrency = stipendCurrency;
    }

    public Integer getAvailablePositions() {
        return availablePositions;
    }

    public void setAvailablePositions(Integer availablePositions) {
        this.availablePositions = availablePositions;
    }

    public String getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(String applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(String publishedAt) {
        this.publishedAt = publishedAt;
    }

    public String getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(String createdAt) {
        this.createdAt = createdAt;
    }

    public CompanyResponse getCompany() {
        return company;
    }

    public void setCompany(CompanyResponse company) {
        this.company = company;
    }

    public List<String> getRequiredSkills() {
        return requiredSkills;
    }

    public void setRequiredSkills(List<String> requiredSkills) {
        this.requiredSkills = requiredSkills;
    }
}

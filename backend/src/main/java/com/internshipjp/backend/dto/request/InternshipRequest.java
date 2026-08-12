package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Employer create/update payload for an internship.
 * TODO MEMBER_3: add the required-skills list and deadline business rules.
 */
public class InternshipRequest {
    @NotBlank
    @Size(max = 150)
    private String title;

    @Size(max = 2000)
    private String description;

    @Size(max = 2000)
    private String responsibilities;

    @Size(max = 2000)
    private String requirements;

    @Size(max = 150)
    private String location;

    @Pattern(regexp = "ONSITE|REMOTE|HYBRID", message = "workMode must be ONSITE, REMOTE or HYBRID")
    private String workMode;

    @Min(1)
    @Max(36)
    private Integer durationMonths;

    @DecimalMin("0.0")
    private BigDecimal stipendAmount;

    @Size(max = 10)
    private String stipendCurrency;

    @Min(1)
    @Max(999)
    private Integer availablePositions;

    private LocalDate applicationDeadline;

    @Pattern(regexp = "DRAFT|OPEN|CLOSED|FILLED|ARCHIVED", message = "Unknown internship status")
    private String status;

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

    public LocalDate getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(LocalDate applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}

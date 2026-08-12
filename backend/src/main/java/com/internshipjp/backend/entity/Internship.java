package com.internshipjp.backend.entity;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * An internship vacancy. Only OPEN internships are visible to students.
 * Owner: Member 3.
 */
@Entity
@Table(name = "internships")
public class Internship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    // users.id of the employer who created it (audit only).
    @Column(name = "created_by")
    private Long createdBy;

    @Column(name = "title", nullable = false, length = 150)
    private String title;

    @Column(name = "description", length = 2000)
    private String description;

    @Column(name = "responsibilities", length = 2000)
    private String responsibilities;

    @Column(name = "requirements", length = 2000)
    private String requirements;

    @Column(name = "location", length = 150)
    private String location;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_mode", nullable = false, length = 20)
    private WorkMode workMode;

    @Column(name = "duration_months")
    private Integer durationMonths;

    @Column(name = "stipend_amount", precision = 10, scale = 2)
    private BigDecimal stipendAmount;

    @Column(name = "stipend_currency", length = 10)
    private String stipendCurrency;

    @Column(name = "available_positions", nullable = false)
    private int availablePositions;

    @Column(name = "application_deadline")
    private LocalDate applicationDeadline;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private InternshipStatus status;

    @Column(name = "published_at")
    private LocalDateTime publishedAt;

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

    public Company getCompany() {
        return company;
    }

    public void setCompany(Company company) {
        this.company = company;
    }

    public Long getCreatedBy() {
        return createdBy;
    }

    public void setCreatedBy(Long createdBy) {
        this.createdBy = createdBy;
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

    public WorkMode getWorkMode() {
        return workMode;
    }

    public void setWorkMode(WorkMode workMode) {
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

    public int getAvailablePositions() {
        return availablePositions;
    }

    public void setAvailablePositions(int availablePositions) {
        this.availablePositions = availablePositions;
    }

    public LocalDate getApplicationDeadline() {
        return applicationDeadline;
    }

    public void setApplicationDeadline(LocalDate applicationDeadline) {
        this.applicationDeadline = applicationDeadline;
    }

    public InternshipStatus getStatus() {
        return status;
    }

    public void setStatus(InternshipStatus status) {
        this.status = status;
    }

    public LocalDateTime getPublishedAt() {
        return publishedAt;
    }

    public void setPublishedAt(LocalDateTime publishedAt) {
        this.publishedAt = publishedAt;
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

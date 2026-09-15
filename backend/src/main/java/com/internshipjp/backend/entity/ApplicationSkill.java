package com.internshipjp.backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

/**
 * One skill, as it stood when an application was submitted.
 *
 * A copy rather than a reference to StudentSkill on purpose. A reference would
 * follow the student as they edit their profile, which is the thing this is
 * here to prevent - and it would break outright if they deleted the skill.
 */
@Entity
@Table(name = "application_skills")
public class ApplicationSkill {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "application_id", nullable = false)
    private Application application;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    /**
     * The category, which is what the interface shows and colours by.
     *
     * Recorded with the skill because a student can reclassify one later, and
     * the application should read as it did when it was sent.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "skill_type", nullable = false, length = 30)
    private SkillType skillType;

    /** Nullable, like the student's own skill: a level is optional. */
    @Enumerated(EnumType.STRING)
    @Column(name = "proficiency", length = 20)
    private ProficiencyLevel proficiency;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Application getApplication() {
        return application;
    }

    public void setApplication(Application application) {
        this.application = application;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public SkillType getSkillType() {
        return skillType;
    }

    public void setSkillType(SkillType skillType) {
        this.skillType = skillType;
    }

    public ProficiencyLevel getProficiency() {
        return proficiency;
    }

    public void setProficiency(ProficiencyLevel proficiency) {
        this.proficiency = proficiency;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}

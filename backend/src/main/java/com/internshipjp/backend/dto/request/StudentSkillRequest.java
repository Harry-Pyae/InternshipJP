package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Create or update one skill.
 */
public class StudentSkillRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Pattern(regexp = "TECHNICAL|SOFT", message = "skillType must be TECHNICAL or SOFT")
    private String skillType;

    @Pattern(regexp = "BEGINNER|INTERMEDIATE|ADVANCED", message = "proficiency must be BEGINNER, INTERMEDIATE or ADVANCED")
    private String proficiency;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSkillType() {
        return skillType;
    }

    public void setSkillType(String skillType) {
        this.skillType = skillType;
    }

    public String getProficiency() {
        return proficiency;
    }

    public void setProficiency(String proficiency) {
        this.proficiency = proficiency;
    }
}

package com.internshipjp.backend.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Create or update one skill.
 *
 * PROGRAMMING_LANGUAGE is Java, PHP, TypeScript. TECHNICAL is a framework or
 * tool. SPOKEN_LANGUAGE is English, Burmese, Japanese.
 */
public class StudentSkillRequest {
    @NotBlank
    @Size(max = 100)
    private String name;

    @NotBlank
    @Pattern(regexp = "PROGRAMMING_LANGUAGE|TECHNICAL|SOFT|SPOKEN_LANGUAGE", message = "skillType must be PROGRAMMING_LANGUAGE, TECHNICAL, SOFT or SPOKEN_LANGUAGE")
    private String skillType;

    

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
}

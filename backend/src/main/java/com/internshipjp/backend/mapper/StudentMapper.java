package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.StudentProfileResponse;
import com.internshipjp.backend.dto.response.StudentSkillResponse;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import org.springframework.stereotype.Component;

/** Entity -> DTO conversion for the student module. */
@Component
public class StudentMapper {

    public StudentProfileResponse toProfile(StudentProfile profile) {
        StudentProfileResponse dto = new StudentProfileResponse();
        dto.setId(profile.getId());
        dto.setFullName(profile.getUser().getFullName());
        dto.setEmail(profile.getUser().getEmail());
        dto.setUniversity(profile.getUniversity());
        dto.setDegree(profile.getDegree());
        dto.setFieldOfStudy(profile.getFieldOfStudy());
        dto.setGraduationYear(profile.getGraduationYear());
        dto.setBiography(profile.getBiography());
        dto.setLocation(profile.getLocation());
        dto.setAvailability(profile.getAvailability());
        dto.setPortfolioUrl(profile.getPortfolioUrl());
        dto.setLinkedinUrl(profile.getLinkedinUrl());
        return dto;
    }

    public StudentSkillResponse toSkill(StudentSkill skill) {
        StudentSkillResponse dto = new StudentSkillResponse();
        dto.setId(skill.getId());
        dto.setName(skill.getName());
        dto.setSkillType(skill.getSkillType().name());
        dto.setProficiency(skill.getProficiency() == null ? null : skill.getProficiency().name());
        return dto;
    }
}

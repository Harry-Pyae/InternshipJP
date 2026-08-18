package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.StudentProfileResponse;
import com.internshipjp.backend.dto.response.StudentSkillResponse;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.time.Period;

/** Entity -> DTO conversion for the student module. */
@Component
public class StudentMapper {

    public StudentProfileResponse toProfile(StudentProfile profile) {
        StudentProfileResponse dto = new StudentProfileResponse();
        dto.setId(profile.getId());
        dto.setFullName(profile.getUser().getFullName());
        dto.setEmail(profile.getUser().getEmail());
        dto.setPhotoPath(profile.getUser().getPhotoPath());
        dto.setHeadline(profile.getHeadline());
        dto.setUniversity(profile.getUniversity());
        dto.setDegree(profile.getDegree());
        dto.setFieldOfStudy(profile.getFieldOfStudy());
        dto.setGraduationYear(profile.getGraduationYear());
        dto.setCurrentlyAttending(profile.isCurrentlyAttending());
        dto.setDateOfBirth(Dates.format(profile.getDateOfBirth()));
        dto.setAge(ageOf(profile.getDateOfBirth()));
        dto.setBiography(profile.getBiography());
        dto.setLocation(profile.getLocation());
        dto.setCountry(profile.getCountry());
        dto.setAvailability(profile.getAvailability());
        dto.setPreferredWorkMode(profile.getPreferredWorkMode() == null
                ? null : profile.getPreferredWorkMode().name());
        dto.setAvailableFrom(Dates.format(profile.getAvailableFrom()));
        dto.setPortfolioUrl(profile.getPortfolioUrl());
        dto.setLinkedinUrl(profile.getLinkedinUrl());
        dto.setGithubUrl(profile.getGithubUrl());
        return dto;
    }

    /**
     * Age from the date of birth, worked out fresh on every read.
     *
     * This is why the database stores the birth date and not the age: a stored
     * age is correct until the person's next birthday and then quietly wrong,
     * with nothing to tell you. A subtraction cannot go stale.
     */
    private Integer ageOf(LocalDate dateOfBirth) {
        if (dateOfBirth == null) {
            return null;
        }
        return Period.between(dateOfBirth, LocalDate.now()).getYears();
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

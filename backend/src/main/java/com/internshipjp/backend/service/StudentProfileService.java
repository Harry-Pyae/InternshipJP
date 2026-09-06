package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.StudentEducationRequest;
import com.internshipjp.backend.dto.request.StudentSkillRequest;
import com.internshipjp.backend.dto.request.UpdateStudentProfileRequest;
import com.internshipjp.backend.dto.response.StudentEducationResponse;
import com.internshipjp.backend.dto.response.StudentProfileResponse;
import com.internshipjp.backend.dto.response.StudentSkillResponse;
import com.internshipjp.backend.entity.SkillType;
import com.internshipjp.backend.entity.StudentEducation;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.entity.WorkMode;
import com.internshipjp.backend.exception.ConflictException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.StudentMapper;
import com.internshipjp.backend.repository.StudentEducationRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Student profile, skills and education.
 *
 * Every operation uses the signed-in user's id and never accepts a
 * student id from the frontend.
 *
 * Owner: Member 2.
 */
@Service
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentEducationRepository studentEducationRepository;
    private final StudentMapper studentMapper;

    public StudentProfileService(
            StudentProfileRepository studentProfileRepository,
            StudentSkillRepository studentSkillRepository,
            StudentEducationRepository studentEducationRepository,
            StudentMapper studentMapper) {

        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentEducationRepository = studentEducationRepository;
        this.studentMapper = studentMapper;
    }

    // =========================
    // PROFILE
    // =========================

    @Transactional(readOnly = true)
    public StudentProfile requireProfileByUserId(Long userId) {
        return studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(
                        "No student profile is attached to this account."
                ));
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getOwnProfile(Long userId) {
        return studentMapper.toProfile(
                requireProfileByUserId(userId)
        );
    }

    @Transactional
    public StudentProfileResponse updateOwnProfile(
            Long userId,
            UpdateStudentProfileRequest request) {

        StudentProfile profile = requireProfileByUserId(userId);

        profile.setHeadline(request.getHeadline());
        profile.setDateOfBirth(request.getDateOfBirth());

        if (request.getCurrentlyAttending() != null) {
            profile.setCurrentlyAttending(
                    request.getCurrentlyAttending()
            );
        }

        profile.setCountry(request.getCountry());
        profile.setGithubUrl(request.getGithubUrl());

        profile.setPreferredWorkMode(
                StringUtils.hasText(request.getPreferredWorkMode())
                        ? WorkMode.valueOf(request.getPreferredWorkMode())
                        : null
        );

        profile.setAvailableFrom(request.getAvailableFrom());
        profile.setUniversity(request.getUniversity());
        profile.setDegree(request.getDegree());
        profile.setFieldOfStudy(request.getFieldOfStudy());
        profile.setGraduationYear(request.getGraduationYear());
        profile.setBiography(request.getBiography());
        profile.setLocation(request.getLocation());
        profile.setAvailability(request.getAvailability());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setLinkedinUrl(request.getLinkedinUrl());

        return studentMapper.toProfile(
                studentProfileRepository.save(profile)
        );
    }

    // =========================
    // SKILLS
    // =========================

    @Transactional(readOnly = true)
    public List<StudentSkillResponse> listOwnSkills(Long userId) {

        StudentProfile profile = requireProfileByUserId(userId);

        return studentSkillRepository
                .findByStudentProfileIdOrderByNameAsc(profile.getId())
                .stream()
                .map(studentMapper::toSkill)
                .toList();
    }

    @Transactional
    public StudentSkillResponse addOwnSkill(
            Long userId,
            StudentSkillRequest request) {

        StudentProfile profile = requireProfileByUserId(userId);

        String name = request.getName().trim();

        if (studentSkillRepository
                .existsByStudentProfileIdAndNameIgnoreCase(
                        profile.getId(),
                        name)) {

            throw new ConflictException(
                    "You have already added the skill \"" + name + "\"."
            );
        }

        StudentSkill skill = new StudentSkill();

        skill.setStudentProfile(profile);
        skill.setName(name);
        skill.setSkillType(
                SkillType.valueOf(request.getSkillType())
        );

        return studentMapper.toSkill(
                studentSkillRepository.save(skill)
        );
    }

    @Transactional
    public StudentSkillResponse updateOwnSkill(
            Long userId,
            Long skillId,
            StudentSkillRequest request) {

        StudentProfile profile = requireProfileByUserId(userId);

        StudentSkill skill =
                studentSkillRepository
                        .findByIdAndStudentProfileId(
                                skillId,
                                profile.getId()
                        )
                        .orElseThrow(
                                () -> NotFoundException.of(
                                        "Skill",
                                        skillId
                                )
                        );

        skill.setName(request.getName().trim());

        skill.setSkillType(
                SkillType.valueOf(request.getSkillType())
        );

        return studentMapper.toSkill(
                studentSkillRepository.save(skill)
        );
    }

    @Transactional
    public void deleteOwnSkill(
            Long userId,
            Long skillId) {

        StudentProfile profile = requireProfileByUserId(userId);

        StudentSkill skill =
                studentSkillRepository
                        .findByIdAndStudentProfileId(
                                skillId,
                                profile.getId()
                        )
                        .orElseThrow(
                                () -> NotFoundException.of(
                                        "Skill",
                                        skillId
                                )
                        );

        studentSkillRepository.delete(skill);
    }

    // =========================
    // EDUCATION
    // =========================

    @Transactional(readOnly = true)
    public List<StudentEducationResponse> listOwnEducation(
            Long userId) {

        StudentProfile profile = requireProfileByUserId(userId);

        return studentEducationRepository
                .findByStudentProfileIdOrderByEndYearDesc(profile.getId())
                .stream()
                .map(studentMapper::toEducation)
                .toList();
    }

    @Transactional
    public StudentEducationResponse addOwnEducation(
            Long userId,
            StudentEducationRequest request) {

        StudentProfile profile = requireProfileByUserId(userId);

        StudentEducation education = new StudentEducation();

        education.setStudentProfile(profile);
        education.setInstitution(request.getInstitution().trim());
        education.setDegree(trimToNull(request.getDegree()));
        education.setFieldOfStudy(
                trimToNull(request.getFieldOfStudy())
        );
        education.setStartYear(request.getStartYear());
        education.setEndYear(request.getEndYear());
        education.setGrade(trimToNull(request.getGrade()));

        return studentMapper.toEducation(
                studentEducationRepository.save(education)
        );
    }

    @Transactional
    public StudentEducationResponse updateOwnEducation(
            Long userId,
            Long educationId,
            StudentEducationRequest request) {

        StudentProfile profile = requireProfileByUserId(userId);

        StudentEducation education =
                studentEducationRepository
                        .findByIdAndStudentProfileId(
                                educationId,
                                profile.getId()
                        )
                        .orElseThrow(
                                () -> NotFoundException.of(
                                        "Education",
                                        educationId
                                )
                        );

        education.setInstitution(
                request.getInstitution().trim()
        );

        education.setDegree(
                trimToNull(request.getDegree())
        );

        education.setFieldOfStudy(
                trimToNull(request.getFieldOfStudy())
        );

        education.setStartYear(request.getStartYear());
        education.setEndYear(request.getEndYear());

        education.setGrade(
                trimToNull(request.getGrade())
        );

        return studentMapper.toEducation(
                studentEducationRepository.save(education)
        );
    }

    @Transactional
    public void deleteOwnEducation(
            Long userId,
            Long educationId) {

        StudentProfile profile = requireProfileByUserId(userId);

        StudentEducation education =
                studentEducationRepository
                        .findByIdAndStudentProfileId(
                                educationId,
                                profile.getId()
                        )
                        .orElseThrow(
                                () -> NotFoundException.of(
                                        "Education",
                                        educationId
                                )
                        );

        studentEducationRepository.delete(education);
    }

    // =========================
    // HELPERS
    // =========================

    private String trimToNull(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }

        return value.trim();
    }
}
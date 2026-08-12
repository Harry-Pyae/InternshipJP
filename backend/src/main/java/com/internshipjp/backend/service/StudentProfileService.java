package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.StudentSkillRequest;
import com.internshipjp.backend.dto.request.UpdateStudentProfileRequest;
import com.internshipjp.backend.dto.response.StudentProfileResponse;
import com.internshipjp.backend.dto.response.StudentSkillResponse;
import com.internshipjp.backend.entity.ProficiencyLevel;
import com.internshipjp.backend.entity.SkillType;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.exception.ConflictException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.StudentMapper;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Student profile and skills.
 *
 * TODO MEMBER_2: this covers the profile fields and skill CRUD so the module
 * runs end to end. Still yours to build:
 *   - education records (the student_education table and repository exist)
 *   - career interests (student_interests)
 *   - resume upload using FileStorageService, the same way certificates work
 *   - profile completion percentage for the dashboard
 */
@Service
public class StudentProfileService {

    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentMapper studentMapper;

    public StudentProfileService(StudentProfileRepository studentProfileRepository,
                                 StudentSkillRepository studentSkillRepository,
                                 StudentMapper studentMapper) {
        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentMapper = studentMapper;
    }

    /**
     * The profile of the signed-in student.
     *
     * Every other method in the student module starts here, which is what
     * makes it impossible to reach another student's data by id.
     */
    @Transactional(readOnly = true)
    public StudentProfile requireProfileByUserId(Long userId) {
        return studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(
                        "No student profile is attached to this account."));
    }

    @Transactional(readOnly = true)
    public StudentProfileResponse getOwnProfile(Long userId) {
        return studentMapper.toProfile(requireProfileByUserId(userId));
    }

    @Transactional
    public StudentProfileResponse updateOwnProfile(Long userId, UpdateStudentProfileRequest request) {
        StudentProfile profile = requireProfileByUserId(userId);
        profile.setUniversity(request.getUniversity());
        profile.setDegree(request.getDegree());
        profile.setFieldOfStudy(request.getFieldOfStudy());
        profile.setGraduationYear(request.getGraduationYear());
        profile.setBiography(request.getBiography());
        profile.setLocation(request.getLocation());
        profile.setAvailability(request.getAvailability());
        profile.setPortfolioUrl(request.getPortfolioUrl());
        profile.setLinkedinUrl(request.getLinkedinUrl());
        return studentMapper.toProfile(studentProfileRepository.save(profile));
    }

    @Transactional(readOnly = true)
    public List<StudentSkillResponse> listOwnSkills(Long userId) {
        StudentProfile profile = requireProfileByUserId(userId);
        return studentSkillRepository.findByStudentProfileIdOrderByNameAsc(profile.getId())
                .stream().map(studentMapper::toSkill).toList();
    }

    @Transactional
    public StudentSkillResponse addOwnSkill(Long userId, StudentSkillRequest request) {
        StudentProfile profile = requireProfileByUserId(userId);
        String name = request.getName().trim();

        if (studentSkillRepository.existsByStudentProfileIdAndNameIgnoreCase(profile.getId(), name)) {
            throw new ConflictException("You have already added the skill \"" + name + "\".");
        }

        StudentSkill skill = new StudentSkill();
        skill.setStudentProfile(profile);
        skill.setName(name);
        skill.setSkillType(SkillType.valueOf(request.getSkillType()));
        skill.setProficiency(parseProficiency(request.getProficiency()));
        return studentMapper.toSkill(studentSkillRepository.save(skill));
    }

    @Transactional
    public StudentSkillResponse updateOwnSkill(Long userId, Long skillId, StudentSkillRequest request) {
        StudentProfile profile = requireProfileByUserId(userId);
        StudentSkill skill = studentSkillRepository.findByIdAndStudentProfileId(skillId, profile.getId())
                .orElseThrow(() -> NotFoundException.of("Skill", skillId));

        skill.setName(request.getName().trim());
        skill.setSkillType(SkillType.valueOf(request.getSkillType()));
        skill.setProficiency(parseProficiency(request.getProficiency()));
        return studentMapper.toSkill(studentSkillRepository.save(skill));
    }

    @Transactional
    public void deleteOwnSkill(Long userId, Long skillId) {
        StudentProfile profile = requireProfileByUserId(userId);
        StudentSkill skill = studentSkillRepository.findByIdAndStudentProfileId(skillId, profile.getId())
                .orElseThrow(() -> NotFoundException.of("Skill", skillId));
        studentSkillRepository.delete(skill);
    }

    private ProficiencyLevel parseProficiency(String value) {
        return StringUtils.hasText(value) ? ProficiencyLevel.valueOf(value) : null;
    }
}

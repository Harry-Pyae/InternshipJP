package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.StudentEducationRequest;
import com.internshipjp.backend.dto.request.StudentSkillRequest;
import com.internshipjp.backend.dto.request.UpdateStudentProfileRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.dto.response.StudentEducationResponse;
import com.internshipjp.backend.dto.response.StudentProfileResponse;
import com.internshipjp.backend.dto.response.StudentSkillResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.StudentProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The signed-in student's own profile, skills and education.
 *
 * All endpoints use "me" and obtain the student identity from the session.
 *
 * Owner: Member 2.
 */
@RestController
@RequestMapping("/api/students/me")
public class StudentController {

    private final StudentProfileService studentProfileService;
    private final CurrentUserService currentUserService;

    public StudentController(
            StudentProfileService studentProfileService,
            CurrentUserService currentUserService) {

        this.studentProfileService = studentProfileService;
        this.currentUserService = currentUserService;
    }

    // =========================
    // PROFILE
    // =========================

    @GetMapping
    public StudentProfileResponse getProfile() {
        return studentProfileService.getOwnProfile(
                currentUserService.requireUserId()
        );
    }

    @PutMapping
    public StudentProfileResponse updateProfile(
            @Valid @RequestBody UpdateStudentProfileRequest request) {

        return studentProfileService.updateOwnProfile(
                currentUserService.requireUserId(),
                request
        );
    }

    // =========================
    // SKILLS
    // =========================

    @GetMapping("/skills")
    public List<StudentSkillResponse> listSkills() {
        return studentProfileService.listOwnSkills(
                currentUserService.requireUserId()
        );
    }

    @PostMapping("/skills")
    public ResponseEntity<StudentSkillResponse> addSkill(
            @Valid @RequestBody StudentSkillRequest request) {

        StudentSkillResponse created =
                studentProfileService.addOwnSkill(
                        currentUserService.requireUserId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @PutMapping("/skills/{id}")
    public StudentSkillResponse updateSkill(
            @PathVariable Long id,
            @Valid @RequestBody StudentSkillRequest request) {

        return studentProfileService.updateOwnSkill(
                currentUserService.requireUserId(),
                id,
                request
        );
    }

    @DeleteMapping("/skills/{id}")
    public ApiMessageResponse deleteSkill(
            @PathVariable Long id) {

        studentProfileService.deleteOwnSkill(
                currentUserService.requireUserId(),
                id
        );

        return new ApiMessageResponse("Skill removed.");
    }

    // =========================
    // EDUCATION
    // =========================

    @GetMapping("/education")
    public List<StudentEducationResponse> listEducation() {
        return studentProfileService.listOwnEducation(
                currentUserService.requireUserId()
        );
    }

    @PostMapping("/education")
    public ResponseEntity<StudentEducationResponse> addEducation(
            @Valid @RequestBody StudentEducationRequest request) {

        StudentEducationResponse created =
                studentProfileService.addOwnEducation(
                        currentUserService.requireUserId(),
                        request
                );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(created);
    }

    @PutMapping("/education/{id}")
    public StudentEducationResponse updateEducation(
            @PathVariable Long id,
            @Valid @RequestBody StudentEducationRequest request) {

        return studentProfileService.updateOwnEducation(
                currentUserService.requireUserId(),
                id,
                request
        );
    }

    @DeleteMapping("/education/{id}")
    public ApiMessageResponse deleteEducation(
            @PathVariable Long id) {

        studentProfileService.deleteOwnEducation(
                currentUserService.requireUserId(),
                id
        );

        return new ApiMessageResponse("Education removed.");
    }
}
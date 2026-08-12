package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.StudentSkillRequest;
import com.internshipjp.backend.dto.request.UpdateStudentProfileRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
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
 * The signed-in student's own profile and skills.
 *
 * Notice that no endpoint takes a student id. Every path says "me", and the
 * identity comes from the session. That is what makes it impossible to read or
 * edit another student's profile by changing a number in the URL.
 *
 * Owner: Member 2.
 */
@RestController
@RequestMapping("/api/students/me")
public class StudentController {

    private final StudentProfileService studentProfileService;
    private final CurrentUserService currentUserService;

    public StudentController(StudentProfileService studentProfileService,
                             CurrentUserService currentUserService) {
        this.studentProfileService = studentProfileService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public StudentProfileResponse getProfile() {
        return studentProfileService.getOwnProfile(currentUserService.requireUserId());
    }

    @PutMapping
    public StudentProfileResponse updateProfile(@Valid @RequestBody UpdateStudentProfileRequest request) {
        return studentProfileService.updateOwnProfile(currentUserService.requireUserId(), request);
    }

    @GetMapping("/skills")
    public List<StudentSkillResponse> listSkills() {
        return studentProfileService.listOwnSkills(currentUserService.requireUserId());
    }

    @PostMapping("/skills")
    public ResponseEntity<StudentSkillResponse> addSkill(@Valid @RequestBody StudentSkillRequest request) {
        StudentSkillResponse created =
                studentProfileService.addOwnSkill(currentUserService.requireUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/skills/{id}")
    public StudentSkillResponse updateSkill(@PathVariable Long id,
                                            @Valid @RequestBody StudentSkillRequest request) {
        return studentProfileService.updateOwnSkill(currentUserService.requireUserId(), id, request);
    }

    @DeleteMapping("/skills/{id}")
    public ApiMessageResponse deleteSkill(@PathVariable Long id) {
        studentProfileService.deleteOwnSkill(currentUserService.requireUserId(), id);
        return new ApiMessageResponse("Skill removed.");
    }
}

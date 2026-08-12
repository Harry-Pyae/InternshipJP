package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.CreateApplicationRequest;
import com.internshipjp.backend.dto.response.ApplicationSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Applying to an internship, and the student's own application history.
 *
 * The POST lives under /api/internships/{id}/applications because that reads
 * naturally, but it is student-only - hence the @PreAuthorize. The GET sits
 * under /api/student/** which SecurityConfig already restricts to students.
 *
 * Owner: Member 3 (workflow) / Member 2 (student screens).
 */
@RestController
public class StudentApplicationController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ApplicationService applicationService;
    private final CurrentUserService currentUserService;

    public StudentApplicationController(ApplicationService applicationService,
                                        CurrentUserService currentUserService) {
        this.applicationService = applicationService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/api/internships/{id}/applications")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<ApplicationSummaryResponse> apply(
            @PathVariable Long id,
            @Valid @RequestBody CreateApplicationRequest request) {
        ApplicationSummaryResponse created =
                applicationService.apply(currentUserService.requireUserId(), id, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/api/student/applications")
    public PageResponse<ApplicationSummaryResponse> myApplications(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return applicationService.listOwn(currentUserService.requireUserId(),
                PageRequest.of(Math.max(page, 0), safeSize));
    }
}

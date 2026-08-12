package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.InternshipRequest;
import com.internshipjp.backend.dto.response.InternshipDetailResponse;
import com.internshipjp.backend.dto.response.InternshipSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.InternshipService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Internship management for the employer who owns them.
 *
 * PUBLISHING RULE
 *   Saving a DRAFT always works. Setting the status to OPEN requires the
 *   company to be APPROVED, and the request is refused with a readable 403
 *   otherwise. That check is in EmployerService.requireApprovedCompany.
 *
 * Owner: Member 3.
 */
@RestController
@RequestMapping("/api/employer/internships")
public class EmployerInternshipController {

    private static final int MAX_PAGE_SIZE = 50;

    private final InternshipService internshipService;
    private final CurrentUserService currentUserService;

    public EmployerInternshipController(InternshipService internshipService,
                                        CurrentUserService currentUserService) {
        this.internshipService = internshipService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public PageResponse<InternshipSummaryResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return internshipService.listOwn(currentUserService.requireUserId(),
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/{id}")
    public InternshipDetailResponse get(@PathVariable Long id) {
        return internshipService.getOwnDetail(currentUserService.requireUserId(), id);
    }

    @PostMapping
    public ResponseEntity<InternshipDetailResponse> create(@Valid @RequestBody InternshipRequest request) {
        InternshipDetailResponse created =
                internshipService.create(currentUserService.requireUserId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public InternshipDetailResponse update(@PathVariable Long id,
                                           @Valid @RequestBody InternshipRequest request) {
        return internshipService.update(currentUserService.requireUserId(), id, request);
    }
}

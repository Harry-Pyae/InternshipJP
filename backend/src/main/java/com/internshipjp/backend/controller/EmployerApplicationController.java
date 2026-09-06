package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.UpdateApplicationStatusRequest;
import com.internshipjp.backend.dto.response.ApplicationDetailResponse;
import com.internshipjp.backend.dto.response.ApplicationSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.ApplicationService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import com.internshipjp.backend.dto.request.ApplicantMessageRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Applicant review for the employer.
 *
 * The detail response includes verifiedCertificates - and only verified ones.
 * That filtering happens in CertificateService, so it cannot be bypassed by
 * calling this endpoint directly.
 *
 * TODO MEMBER_3: add filtering and sorting of the applicant list (by status,
 * by match score), and bulk shortlisting.
 *
 * Owner: Member 3.
 */
@RestController
@RequestMapping("/api/employer")
public class EmployerApplicationController {

    private static final int MAX_PAGE_SIZE = 50;

    private final ApplicationService applicationService;
    private final CurrentUserService currentUserService;

    public EmployerApplicationController(ApplicationService applicationService,
                                         CurrentUserService currentUserService) {
        this.applicationService = applicationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/internships/{id}/applications")
    public PageResponse<ApplicationSummaryResponse> listForInternship(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return applicationService.listForOwnInternship(currentUserService.requireUserId(), id,
                PageRequest.of(Math.max(page, 0), safeSize));
    }

    @GetMapping("/applications/{id}")
    public ApplicationDetailResponse get(@PathVariable Long id) {
        return applicationService.getForOwnCompany(currentUserService.requireUserId(), id);
    }

    /**
     * Ask the applicant for something. Delivered as a notification, which the
     * student already has a page for.
     */
    @PostMapping("/applications/{id}/message")
    public ApiMessageResponse message(@PathVariable Long id,
                                      @Valid @RequestBody ApplicantMessageRequest request) {
        applicationService.messageApplicant(currentUserService.requireUserId(), id,
                request.getMessage().trim());
        return new ApiMessageResponse("Your message was sent to the applicant.");
    }

    @PatchMapping("/applications/{id}/status")
    public ApplicationSummaryResponse updateStatus(@PathVariable Long id,
                                                    @Valid @RequestBody UpdateApplicationStatusRequest request) {
        return applicationService.updateStatus(currentUserService.requireUserId(), id, request);
    }
}

package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.CertificateVerificationRequest;
import com.internshipjp.backend.dto.response.CertificateResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.CertificateService;
import jakarta.validation.Valid;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Certificate verification queue for administrators.
 *
 * This is the endpoint that gives the platform its integrity: until an admin
 * sets a certificate to VERIFIED here, no employer will ever see it.
 * Download the file itself through GET /api/certificates/{id}/file.
 *
 * Owner: Member 4.
 */
@RestController
@RequestMapping("/api/admin/certificates")
public class AdminCertificateController {

    private static final int MAX_PAGE_SIZE = 100;

    private final CertificateService certificateService;
    private final CurrentUserService currentUserService;

    public AdminCertificateController(CertificateService certificateService,
                                      CurrentUserService currentUserService) {
        this.certificateService = certificateService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/pending")
    public PageResponse<CertificateResponse> pending(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return certificateService.listPending(
                PageRequest.of(Math.max(page, 0), safeSize, Sort.by(Sort.Direction.ASC, "createdAt")));
    }

    @GetMapping("/{id}")
    public CertificateResponse get(@PathVariable Long id) {
        return certificateService.getForAdmin(id);
    }

    /** Body: { "status": "VERIFIED", "note": "Certificate checked and accepted." } */
    @PatchMapping("/{id}/verification")
    public CertificateResponse verify(@PathVariable Long id,
                                      @Valid @RequestBody CertificateVerificationRequest request) {
        return certificateService.verify(currentUserService.requireUserId(), id, request);
    }
}

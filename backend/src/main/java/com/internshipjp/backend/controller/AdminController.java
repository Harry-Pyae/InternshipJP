package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.CompanyApprovalRequest;
import com.internshipjp.backend.dto.request.UpdateUserStatusRequest;
import com.internshipjp.backend.dto.response.AdminUserResponse;
import com.internshipjp.backend.dto.response.CompanyResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.AdminService;
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
 * Administrator operations. The whole /api/admin/** tree is ADMIN-only in
 * SecurityConfig, so no method here needs its own role check.
 *
 * "employers/pending" lists companies waiting for approval: approving a
 * company is what activates its recruiter accounts.
 *
 * TODO MEMBER_4: add reports, activity monitoring and an audit log of admin
 * actions, plus the admin React screens.
 *
 * Owner: Member 4.
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private static final int MAX_PAGE_SIZE = 100;

    private final AdminService adminService;
    private final CurrentUserService currentUserService;

    public AdminController(AdminService adminService, CurrentUserService currentUserService) {
        this.adminService = adminService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/employers/pending")
    public PageResponse<CompanyResponse> pendingEmployers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return adminService.listPendingCompanies(
                PageRequest.of(Math.max(page, 0), safeSize(size),
                        Sort.by(Sort.Direction.ASC, "createdAt")));
    }

    /** The id is the COMPANY id, because approval is a decision about a company. */
    @PatchMapping("/employers/{id}/approval")
    public CompanyResponse decideEmployer(@PathVariable Long id,
                                          @Valid @RequestBody CompanyApprovalRequest request) {
        return adminService.decideCompany(currentUserService.requireUserId(), id, request);
    }

    @GetMapping("/users")
    public PageResponse<AdminUserResponse> users(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return adminService.listUsers(role, status, search,
                PageRequest.of(Math.max(page, 0), safeSize(size),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @PatchMapping("/users/{id}/status")
    public AdminUserResponse updateUserStatus(@PathVariable Long id,
                                              @Valid @RequestBody UpdateUserStatusRequest request) {
        return adminService.updateUserStatus(currentUserService.requireUserId(), id, request);
    }

    private int safeSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }
}

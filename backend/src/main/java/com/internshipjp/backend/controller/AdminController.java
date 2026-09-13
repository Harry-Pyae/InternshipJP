package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.response.InternshipSummaryResponse;
import com.internshipjp.backend.dto.response.InternshipDetailResponse;
import com.internshipjp.backend.service.InternshipService;
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
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import com.internshipjp.backend.dto.request.InviteAdminRequest;
import com.internshipjp.backend.service.AdminInviteService;


/**
 * Administrator operations. The whole /api/admin/** tree is ADMIN-only in
 * SecurityConfig, so no method here needs its own role check.
 *
 * "employers/pending" lists companies waiting for approval: approving a
 * company is what activates its recruiter accounts.
 *
 * Future work: add reports, activity monitoring and an audit log of admin
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
    private final InternshipService internshipService;
    private final AdminInviteService adminInviteService;

    public AdminController(AdminService adminService, CurrentUserService currentUserService,
                           InternshipService internshipService,
                           AdminInviteService adminInviteService) {
        this.adminService = adminService;
        this.currentUserService = currentUserService;
        this.internshipService = internshipService;
        this.adminInviteService = adminInviteService;
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

    /**
     * Deletes an account permanently.
     *
     * Kept separate from suspension on purpose. Suspending is reversible and
     * is the right answer almost always; this is for a duplicate or a test
     * account that should not exist at all.
     */
    /**
     * Releases a sign-in lock so someone can try again immediately.
     *
     * Separate from account status: a lock is temporary and expires on its own,
     * while suspension is a decision. Conflating them would make it impossible
     * to tell why an account cannot sign in.
     */
    @PostMapping("/users/{id}/unlock")
    public ApiMessageResponse unlockSignIn(@PathVariable Long id) {
        adminService.unlockSignIn(id);
        return new ApiMessageResponse("Sign-in was unlocked for that account.");
    }

    @DeleteMapping("/users/{id}")
    public ApiMessageResponse deleteUser(@PathVariable Long id) {
        adminService.deleteUser(currentUserService.requireUserId(), id);
        return new ApiMessageResponse("The account was deleted.");
    }

    @PatchMapping("/users/{id}/status")
    public AdminUserResponse updateUserStatus(@PathVariable Long id,
                                              @Valid @RequestBody UpdateUserStatusRequest request) {
        return adminService.updateUserStatus(currentUserService.requireUserId(), id, request);
    }

    @GetMapping("/internships")
    public PageResponse<InternshipSummaryResponse> internships(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return internshipService.listForAdmin(keyword, status,
                PageRequest.of(Math.max(page, 0), safeSize(size),
                        Sort.by(Sort.Direction.DESC, "createdAt")));
    }

    @GetMapping("/internships/{id}")
    public InternshipDetailResponse internship(@PathVariable Long id) {
        return internshipService.getAdminDetail(id);
    }

    private int safeSize(int size) {
        return Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
    }

    /**
     * Invites another administrator.
     *
     * There is no create-an-administrator form anywhere: one administrator
     * setting another's password would mean two people knew it. The invited
     * account is created with no password, and the invitee proves control of
     * the mailbox before choosing their own.
     *
     * A pending invitation is a User with role ADMIN and status PENDING, so it
     * appears in the list below under filters that already exist. Every
     * administrator can see who was invited without a separate queue.
     */
    /** Everything known about one account, including its role-specific profile. */
    @GetMapping("/users/{id}")
    public AdminUserResponse user(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    @PostMapping("/invites")
    public ApiMessageResponse inviteAdmin(@Valid @RequestBody InviteAdminRequest request) {
        adminInviteService.invite(currentUserService.requireUserId(), request);
        return new ApiMessageResponse(
                "Invitation sent. The account cannot be used until it is accepted.");
    }
}

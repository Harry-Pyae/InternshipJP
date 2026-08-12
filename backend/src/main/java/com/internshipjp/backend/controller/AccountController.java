package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.ChangePasswordRequest;
import com.internshipjp.backend.dto.request.UpdateAccountRequest;
import com.internshipjp.backend.dto.response.AccountResponse;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Account settings that every role shares.
 *
 * All three settings screens (/student/settings, /employer/settings,
 * /admin/settings) will call exactly these endpoints, so the behaviour stays
 * identical for everyone.
 *
 * Owner: Member 2.
 */
@RestController
@RequestMapping("/api/account")
public class AccountController {

    private final AccountService accountService;
    private final CurrentUserService currentUserService;

    public AccountController(AccountService accountService, CurrentUserService currentUserService) {
        this.accountService = accountService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    public AccountResponse getMe() {
        return accountService.getAccount(currentUserService.requireUserId());
    }

    @PutMapping("/me")
    public AccountResponse updateMe(@Valid @RequestBody UpdateAccountRequest request) {
        return accountService.updateAccount(currentUserService.requireUserId(), request);
    }

    @PostMapping("/change-password")
    public ApiMessageResponse changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        accountService.changePassword(currentUserService.requireUserId(), request);
        return new ApiMessageResponse("Your password has been changed.");
    }
}

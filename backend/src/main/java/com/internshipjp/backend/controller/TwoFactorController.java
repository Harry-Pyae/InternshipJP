package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.EmailOtpVerifyRequest;
import com.internshipjp.backend.dto.request.TotpVerifyRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.dto.response.TotpSetupResponse;
import com.internshipjp.backend.dto.response.TwoFactorStatusResponse;
import com.internshipjp.backend.entity.OtpPurpose;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.TwoFactorService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Turning the two second factors on and off.
 *
 * The setup response contains the TOTP secret exactly once, so the user can
 * scan or type it. It is never returned again and never logged.
 *
 * Owner: Member 2.
 */
@RestController
@RequestMapping("/api/account/2fa")
public class TwoFactorController {

    private final TwoFactorService twoFactorService;
    private final CurrentUserService currentUserService;

    public TwoFactorController(TwoFactorService twoFactorService,
                               CurrentUserService currentUserService) {
        this.twoFactorService = twoFactorService;
        this.currentUserService = currentUserService;
    }

    @GetMapping("/status")
    public TwoFactorStatusResponse status() {
        return twoFactorService.getStatus(currentUserService.requireUserId());
    }

    // ------------------------------------------------------------------ TOTP

    @PostMapping("/totp/setup")
    public TotpSetupResponse startTotpSetup() {
        return twoFactorService.startTotpSetup(currentUserService.requireUserId());
    }

    @PostMapping("/totp/verify")
    public ApiMessageResponse verifyTotp(@Valid @RequestBody TotpVerifyRequest request) {
        twoFactorService.verifyTotpSetup(currentUserService.requireUserId(), request.getCode());
        return new ApiMessageResponse("Authenticator app enabled.");
    }

    @PostMapping("/totp/disable")
    public ApiMessageResponse disableTotp() {
        twoFactorService.disableTotp(currentUserService.requireUserId());
        return new ApiMessageResponse("Authenticator app disabled.");
    }

    // ------------------------------------------------------------- email OTP

    @PostMapping("/email/send")
    public ApiMessageResponse sendEmailOtp() {
        twoFactorService.sendEmailOtp(currentUserService.requireUserId(), OtpPurpose.ENABLE_EMAIL_OTP);
        return new ApiMessageResponse("We sent a code to your email address.");
    }

    @PostMapping("/email/verify")
    public ApiMessageResponse verifyEmailOtp(@Valid @RequestBody EmailOtpVerifyRequest request) {
        twoFactorService.verifyEmailOtpSetup(currentUserService.requireUserId(), request.getCode());
        return new ApiMessageResponse("Email verification enabled.");
    }

    @PostMapping("/email/disable")
    public ApiMessageResponse disableEmailOtp() {
        twoFactorService.disableEmailOtp(currentUserService.requireUserId());
        return new ApiMessageResponse("Email verification disabled.");
    }
}

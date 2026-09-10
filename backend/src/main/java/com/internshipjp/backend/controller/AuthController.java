package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.LoginRequest;
import com.internshipjp.backend.dto.request.RegisterEmployerRequest;
import com.internshipjp.backend.dto.request.RegisterStudentRequest;
import com.internshipjp.backend.dto.response.AuthUserResponse;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.AuthService;
import com.internshipjp.backend.dto.request.ForgotPasswordRequest;
import com.internshipjp.backend.dto.request.ResetPasswordRequest;
import com.internshipjp.backend.service.PasswordResetService;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Registration and sign-in.
 *
 * POST /api/auth/logout is not written here: Spring Security handles it (see
 * SecurityConfig), which guarantees the session is really destroyed.
 *
 * Owner: Member 2.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final PasswordResetService passwordResetService;
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;

    public AuthController(AuthService authService,
                          CurrentUserService currentUserService,
                          UserMapper userMapper,
                          PasswordResetService passwordResetService) {
        this.authService = authService;
        this.passwordResetService = passwordResetService;
        this.currentUserService = currentUserService;
        this.userMapper = userMapper;
    }

    /**
     * Hands the browser a CSRF cookie.
     *
     * The React app calls this once at startup. After that, Axios copies the
     * XSRF-TOKEN cookie into the X-XSRF-TOKEN header automatically and every
     * POST/PUT/PATCH/DELETE works. Without this first GET, the very first
     * login attempt would be rejected with 403.
     */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/register/student")
    public ResponseEntity<AuthUserResponse> registerStudent(@Valid @RequestBody RegisterStudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerStudent(request));
    }

    @PostMapping("/register/employer")
    public ResponseEntity<AuthUserResponse> registerEmployer(@Valid @RequestBody RegisterEmployerRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerEmployer(request));
    }

    /**
     * Asks for a reset code.
     *
     * Always answers the same way, whether the address has an account or not.
     * Otherwise this becomes a way to discover who is registered.
     */
    @PostMapping("/forgot-password")
    public ApiMessageResponse forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestReset(request);
        return new ApiMessageResponse(
                "If that address has an account, a reset code is on its way. "
                        + "The code expires in 15 minutes.");
    }

    /** Uses the code to set a new password. */
    @PostMapping("/reset-password")
    public ApiMessageResponse resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request);
        return new ApiMessageResponse("Your password has been changed. You can sign in now.");
    }

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest,
                                  HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    /**
     * Who am I? Asked by React on every page load to restore the session.
     *
     * Answers 200 with an empty body when nobody is signed in, rather than
     * 401. "Nobody" is a valid answer to this question, not an error - and a
     * 401 made the browser log a failed request on every visit to the sign-in
     * page, which is noise that cannot be silenced from JavaScript and buries
     * the errors that do matter.
     *
     * Every other endpoint still returns 401 when it should. This one is a
     * question about the session, not a protected resource.
     */
    @GetMapping("/me")
    public ResponseEntity<AuthUserResponse> me() {
        return currentUserService.currentDetails()
                .map(details -> ResponseEntity.ok(
                        userMapper.toAuthUser(currentUserService.requireUser())))
                .orElseGet(() -> ResponseEntity.noContent().build());
    }
}

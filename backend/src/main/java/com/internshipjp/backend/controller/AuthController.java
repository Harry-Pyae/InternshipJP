package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.LoginRequest;
import com.internshipjp.backend.dto.request.RegisterEmployerRequest;
import com.internshipjp.backend.dto.request.RegisterStudentRequest;
import com.internshipjp.backend.dto.response.AuthUserResponse;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.AuthService;
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
    private final CurrentUserService currentUserService;
    private final UserMapper userMapper;

    public AuthController(AuthService authService,
                          CurrentUserService currentUserService,
                          UserMapper userMapper) {
        this.authService = authService;
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

    @PostMapping("/login")
    public AuthUserResponse login(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest,
                                  HttpServletResponse httpResponse) {
        return authService.login(request, httpRequest, httpResponse);
    }

    /** Who am I? Used by React on every page load to restore the session. */
    @GetMapping("/me")
    public AuthUserResponse me() {
        return userMapper.toAuthUser(currentUserService.requireUser());
    }
}

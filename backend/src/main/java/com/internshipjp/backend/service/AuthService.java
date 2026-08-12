package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.LoginRequest;
import com.internshipjp.backend.dto.request.RegisterEmployerRequest;
import com.internshipjp.backend.dto.request.RegisterStudentRequest;
import com.internshipjp.backend.dto.response.AuthUserResponse;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.ConflictException;
import com.internshipjp.backend.exception.UnauthorizedException;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.AppUserDetails;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Locale;

/**
 * Registration and sign-in.
 *
 * TODO MEMBER_2: this is the baseline that makes the application usable end to
 * end. What is left for you:
 *   - the 2FA login challenge (if the account has TOTP or email OTP enabled,
 *     do not complete the sign-in until the second factor is verified)
 *   - "remember me", account lockout after repeated failures, password reset
 *   - richer registration validation (allowed university email domains, etc.)
 * The endpoint shapes below are already used by the frontend, so extend them
 * rather than replacing them.
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final CompanyRepository companyRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final NotificationService notificationService;
    private final UserMapper userMapper;

    public AuthService(UserRepository userRepository,
                       StudentProfileRepository studentProfileRepository,
                       CompanyRepository companyRepository,
                       EmployerProfileRepository employerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       SecurityContextRepository securityContextRepository,
                       NotificationService notificationService,
                       UserMapper userMapper) {
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.companyRepository = companyRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.notificationService = notificationService;
        this.userMapper = userMapper;
    }

    /**
     * Creates a student account plus its (empty) profile.
     *
     * One transaction: if the profile insert fails, the user row is rolled
     * back too, so we never end up with a student who has no profile.
     */
    @Transactional
    public AuthUserResponse registerStudent(RegisterStudentRequest request) {
        String email = normaliseEmail(request.getEmail());
        requireEmailAvailable(email);

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setRole(Role.STUDENT);
        user.setAccountStatus(AccountStatus.ACTIVE);
        user = userRepository.save(user);

        StudentProfile profile = new StudentProfile();
        profile.setUser(user);
        profile.setUniversity(request.getUniversity());
        profile.setDegree(request.getDegree());
        studentProfileRepository.save(profile);

        return userMapper.toAuthUser(user);
    }

    /**
     * Creates an employer account, the company, and the link between them.
     *
     * The account starts PENDING and the company starts PENDING: an employer
     * cannot publish anything until an administrator approves the company.
     */
    @Transactional
    public AuthUserResponse registerEmployer(RegisterEmployerRequest request) {
        String email = normaliseEmail(request.getEmail());
        requireEmailAvailable(email);

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setRole(Role.EMPLOYER);
        user.setAccountStatus(AccountStatus.PENDING);
        user = userRepository.save(user);

        Company company = new Company();
        company.setName(request.getCompanyName().trim());
        company.setIndustry(request.getIndustry());
        company.setWebsite(request.getWebsite());
        company.setApprovalStatus(ApprovalStatus.PENDING);
        company = companyRepository.save(company);

        EmployerProfile profile = new EmployerProfile();
        profile.setUser(user);
        profile.setCompany(company);
        profile.setJobTitle(request.getJobTitle());
        profile.setWorkEmail(email);
        employerProfileRepository.save(profile);

        // Example notification flow for Member 4 to build on.
        notificationService.notifyAdmins(
                "COMPANY_APPROVAL_REQUESTED",
                "New company waiting for approval",
                company.getName() + " registered and is waiting for review.");

        return userMapper.toAuthUser(user);
    }

    /**
     * Signs the user in and stores the session.
     *
     * Saving the SecurityContext into the SecurityContextRepository is what
     * makes the session survive to the next request - without it the user
     * would appear signed in for exactly one response.
     */
    @Transactional
    public AuthUserResponse login(LoginRequest request,
                                  HttpServletRequest httpRequest,
                                  HttpServletResponse httpResponse) {
        String email = normaliseEmail(request.getEmail());
        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.getPassword()));
        } catch (AuthenticationException ex) {
            // Same message for "unknown email" and "wrong password" on purpose.
            throw new UnauthorizedException("Email or password is incorrect.");
        }

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUserDetails details = (AppUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(details.getId())
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect."));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // TODO MEMBER_2: if 2FA is enabled for this user, do not return a full
        // session here. Return a "challenge required" response instead and only
        // save the SecurityContext once the code has been verified.
        return userMapper.toAuthUser(user);
    }

    private String normaliseEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void requireEmailAvailable(String email) {
        if (userRepository.existsByEmail(email)) {
            throw new ConflictException("An account with that email already exists.");
        }
    }
}

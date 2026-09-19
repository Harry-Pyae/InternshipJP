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
import com.internshipjp.backend.security.LoginAttemptService;
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
import com.internshipjp.backend.security.PasswordPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Registration and sign-in.
 *
 * This is the baseline that makes the application usable end to
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

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;

    private final PasswordPolicy passwordPolicy;
    private final StudentProfileRepository studentProfileRepository;
    private final CompanyRepository companyRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository securityContextRepository;
    private final LoginAttemptService loginAttemptService;
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
                       UserMapper userMapper,
                       LoginAttemptService loginAttemptService,
                          PasswordPolicy passwordPolicy) {

        this.passwordPolicy = passwordPolicy;
        this.userRepository = userRepository;
        this.studentProfileRepository = studentProfileRepository;
        this.companyRepository = companyRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.securityContextRepository = securityContextRepository;
        this.loginAttemptService = loginAttemptService;
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
        // Checked here rather than only by @Size, because the rules that matter
        // most - not your own name, not the first thing anybody would try - are
        // about the person, and an annotation cannot see them.
        passwordPolicy.check(request.getPassword(), request.getEmail(), request.getFullName());
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
        passwordPolicy.check(request.getPassword(), request.getEmail(),
                request.getFullName());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setRole(Role.EMPLOYER);
        user.setAccountStatus(AccountStatus.PENDING);
        user = userRepository.save(user);

        // A second recruiter from a company already here joins it rather than
        // creating a duplicate.
        //
        // Registration used to call new Company() unconditionally, so two
        // managers from the same firm produced two company rows with the same
        // name and the same registration number. The consequences compounded:
        // an administrator reviewed the same real company twice, each manager
        // could see only their own vacancies and applicants, students saw the
        // employer listed twice, and if one manager left their vacancies were
        // stranded where nobody else could reach them.
        //
        // The rest of the system was already built for this. decideCompany
        // loops over every profile attached to a company and activates all of
        // them, and employer_profiles has no unique constraint on company_id.
        // The only thing missing was a way to get into that state.
        String registrationNumber = trimOrNull(request.getRegistrationNumber());
        Company existing = registrationNumber == null ? null
                : companyRepository.findFirstByRegistrationNumberIgnoreCase(registrationNumber)
                        .orElse(null);

        if (existing != null) {
            return joinExistingCompany(user, existing, request, email);
        }

        Company company = new Company();
        company.setName(request.getCompanyName().trim());
        company.setIndustry(request.getIndustry());
        company.setWebsite(request.getWebsite());
        // The fields an administrator needs to make a decision, rather than
        // just a name someone typed.
        company.setRegistrationNumber(trimOrNull(request.getRegistrationNumber()));
        company.setContactEmail(trimOrNull(request.getContactEmail()));
        company.setCountry(trimOrNull(request.getCountry()));
        company.setLocation(trimOrNull(request.getLocation()));
        company.setAddress(trimOrNull(request.getAddress()));
        company.setLinkedinUrl(trimOrNull(request.getLinkedinUrl()));
        company.setContactPhone(trimOrNull(request.getContactPhone()));
        company.setCompanySize(trimOrNull(request.getCompanySize()));
        company.setFoundedYear(request.getFoundedYear());
        company.setDescription(trimOrNull(request.getDescription()));
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
                company.getName() + " registered and is waiting for review.",
                company.getId());

        return userMapper.toAuthUser(user);
    }

    /**
     * Attaches a new recruiter to a company that is already registered.
     *
     * WHAT IS DELIBERATELY NOT DONE HERE
     *   The company's own details are not overwritten. The first registration
     *   is the one an administrator reviewed; letting a later joiner silently
     *   change the address or the name would undo that review without anybody
     *   seeing it.
     *
     *   The approval status is not reset. An approved company does not go back
     *   into the queue because a second person joined, and no second
     *   notification is sent to administrators - there is nothing new to
     *   review.
     *
     * WHAT THE NEW RECRUITER INHERITS
     *   The company's standing. Joining an approved company makes the account
     *   active immediately, because the thing that was being waited on has
     *   already happened. Joining one that is still pending, or was rejected,
     *   leaves the account pending - the same position as the first recruiter.
     */
    private AuthUserResponse joinExistingCompany(User user, Company company,
                                                 RegisterEmployerRequest request, String email) {
        if (company.getApprovalStatus() == ApprovalStatus.APPROVED) {
            user.setAccountStatus(AccountStatus.ACTIVE);
            user = userRepository.save(user);
        }

        // A second name for the same object, because the one above is
        // reassigned by the save and a lambda can only capture a variable that
        // is never reassigned. Nothing else changes.
        final User joiner = user;

        EmployerProfile profile = new EmployerProfile();
        profile.setUser(user);
        profile.setCompany(company);
        profile.setJobTitle(request.getJobTitle());
        profile.setWorkEmail(email);
        employerProfileRepository.save(profile);

        // Everybody already at the company is told.
        //
        // Joining is keyed on the registration number, so a mistyped number
        // attaches somebody to a company that is not theirs - and that company's
        // vacancies and applicants become visible to them. Nothing else would
        // surface that. Telling the existing recruiters makes a wrong join
        // something a person notices rather than something that just happens.
        employerProfileRepository.findByCompanyId(company.getId()).stream()
                .map(EmployerProfile::getUser)
                .filter(existing -> !existing.getId().equals(joiner.getId()))
                .forEach(existing -> notificationService.create(existing,
                        "COMPANY_RECRUITER_JOINED",
                        "Someone joined " + company.getName(),
                        joiner.getFullName() + " (" + email + ") registered as a recruiter for "
                                + company.getName() + ". If you do not recognise them, tell an "
                                + "administrator."));

        log.info("{} joined the existing company {} (id {})",
                email, company.getName(), company.getId());

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

        // Checked before the password is, so a locked address costs an attacker
        // nothing to attack - no hashing, no database round trip.
        if (loginAttemptService.isLocked(email)) {
            throw new UnauthorizedException(
                    "Too many failed attempts. Sign-in for this address is locked for "
                            + loginAttemptService.minutesRemaining(email) + " more minute(s). "
                            + "Wait, or contact an administrator to have it released.");
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(email, request.getPassword()));
        } catch (AuthenticationException ex) {
            loginAttemptService.recordFailure(email);

            // Still the same message whether the address exists or not - the
            // count is kept for every address, so a wrong email and a wrong
            // password are indistinguishable from outside. Only the number of
            // tries left is added, which tells an attacker nothing they could
            // not work out by counting.
            int left = loginAttemptService.attemptsRemaining(email);
            String message = "Email or password is incorrect.";
            if (left == 0) {
                message += " This address is now locked for 15 minutes. Contact an "
                        + "administrator if you need it released sooner.";
            } else if (left <= 2) {
                message += " " + left + " attempt(s) left before this address is locked.";
            }
            throw new UnauthorizedException(message);
        }

        loginAttemptService.recordSuccess(email);

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, httpRequest, httpResponse);

        AppUserDetails details = (AppUserDetails) authentication.getPrincipal();
        User user = userRepository.findById(details.getId())
                .orElseThrow(() -> new UnauthorizedException("Email or password is incorrect."));
        user.setLastLoginAt(LocalDateTime.now());
        userRepository.save(user);

        // Future work, and the half that makes two-factor authentication real.
        //
        // Enrolment is built and tested (/api/account/2fa/**, TotpService,
        // user_two_factor_settings). This line is where it is NOT enforced: a
        // user with a stored secret still gets a full session here without
        // ever being asked for a code.
        //
        // Finishing it means returning a "challenge required" answer instead
        // of an authenticated user, holding the pending identity somewhere the
        // browser cannot forge, and saving the SecurityContext only once the
        // code has been verified. Until that exists there is deliberately no
        // enrolment screen, because a switch that changes nothing at sign-in
        // would promise a protection this line does not provide.
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

    /** Blank optional fields are stored as NULL, so "Not set" means not set. */
    private static String trimOrNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}

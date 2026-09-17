package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.RegisterEmployerRequest;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.mapper.UserMapper;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.security.LoginAttemptService;
import com.internshipjp.backend.security.PasswordPolicy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

/**
 * A second recruiter from a company already registered joins it.
 *
 * Registration used to call new Company() unconditionally, so two managers
 * from the same firm produced two company rows with the same registration
 * number - reviewed twice by an administrator, invisible to each other, and
 * listed twice to students.
 */
class EmployerRegistrationTest {

    private UserRepository userRepository;
    private CompanyRepository companyRepository;
    private EmployerProfileRepository employerProfileRepository;
    private NotificationService notificationService;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        userRepository = Mockito.mock(UserRepository.class);
        companyRepository = Mockito.mock(CompanyRepository.class);
        employerProfileRepository = Mockito.mock(EmployerProfileRepository.class);
        notificationService = Mockito.mock(NotificationService.class);

        authService = new AuthService(
                userRepository,
                Mockito.mock(StudentProfileRepository.class),
                companyRepository,
                employerProfileRepository,
                new BCryptPasswordEncoder(4),
                Mockito.mock(AuthenticationManager.class),
                Mockito.mock(SecurityContextRepository.class),
                notificationService,
                new UserMapper(),
                Mockito.mock(LoginAttemptService.class),
                new PasswordPolicy());

        Mockito.when(userRepository.findByEmail(Mockito.anyString())).thenReturn(Optional.empty());
        Mockito.when(userRepository.save(Mockito.any(User.class)))
                .thenAnswer(i -> i.getArgument(0));
        Mockito.when(companyRepository.save(Mockito.any(Company.class)))
                .thenAnswer(i -> {
                    Company saved = i.getArgument(0);
                    saved.setId(9L);
                    return saved;
                });
    }

    private RegisterEmployerRequest request(String email, String registrationNumber) {
        RegisterEmployerRequest r = new RegisterEmployerRequest();
        r.setEmail(email);
        r.setPassword("Str0ng-Pass1!");
        r.setFullName("Aung Kyaw");
        r.setCompanyName("Acme Limited");
        r.setRegistrationNumber(registrationNumber);
        r.setJobTitle("Hiring manager");
        return r;
    }

    private Company approvedCompany() {
        Company c = new Company();
        c.setId(7L);
        c.setName("Acme Limited");
        c.setRegistrationNumber("SG-1234");
        c.setApprovalStatus(ApprovalStatus.APPROVED);
        return c;
    }

    @Test
    void anUnknownRegistrationNumberCreatesTheCompany() {
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.empty());

        authService.registerEmployer(request("first@acme.com", "SG-1234"));

        Mockito.verify(companyRepository).save(Mockito.any(Company.class));
        // With the company's id, so the notification opens that company's review
        // rather than the whole approval queue.
        Mockito.verify(notificationService).notifyAdmins(
                Mockito.eq("COMPANY_APPROVAL_REQUESTED"), Mockito.anyString(), Mockito.anyString(),
                Mockito.eq(9L));
    }

    @Test
    void aSecondRecruiterJoinsRatherThanCreatingADuplicate() {
        Company existing = approvedCompany();
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.of(existing));

        authService.registerEmployer(request("second@acme.com", "SG-1234"));

        Mockito.verify(companyRepository, Mockito.never()).save(Mockito.any(Company.class));

        ArgumentCaptor<EmployerProfile> saved = ArgumentCaptor.forClass(EmployerProfile.class);
        Mockito.verify(employerProfileRepository).save(saved.capture());
        assertSame(existing, saved.getValue().getCompany(),
                "the new profile should point at the company already here");
    }

    /** Nothing new to review, so administrators are not asked to review it. */
    @Test
    void joiningDoesNotRaiseAnotherApprovalRequest() {
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.of(approvedCompany()));

        authService.registerEmployer(request("second@acme.com", "SG-1234"));

        Mockito.verify(notificationService, Mockito.never()).notifyAdmins(
                Mockito.anyString(), Mockito.anyString(), Mockito.anyString(), Mockito.any());
    }

    /** The wait has already happened, so the account does not wait again. */
    @Test
    void joiningAnApprovedCompanyActivatesTheAccount() {
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.of(approvedCompany()));

        authService.registerEmployer(request("second@acme.com", "SG-1234"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        Mockito.verify(userRepository, Mockito.atLeastOnce()).save(saved.capture());
        assertEquals(AccountStatus.ACTIVE, saved.getValue().getAccountStatus());
    }

    /** Joining one still under review leaves the newcomer where the first is. */
    @Test
    void joiningAPendingCompanyLeavesTheAccountPending() {
        Company pending = approvedCompany();
        pending.setApprovalStatus(ApprovalStatus.PENDING);
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.of(pending));

        authService.registerEmployer(request("second@acme.com", "SG-1234"));

        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        Mockito.verify(userRepository).save(saved.capture());
        assertEquals(AccountStatus.PENDING, saved.getValue().getAccountStatus());
    }

    /**
     * A wrong join is something somebody notices.
     *
     * Joining is keyed on the registration number, so a typo attaches a person
     * to a company that is not theirs. Nothing else would surface that.
     */
    @Test
    void joiningTellsTheRecruitersAlreadyThere() {
        Company existing = approvedCompany();
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("SG-1234"))
                .thenReturn(Optional.of(existing));

        User alreadyThere = new User();
        alreadyThere.setId(99L);
        alreadyThere.setEmail("first@acme.com");
        EmployerProfile theirProfile = new EmployerProfile();
        theirProfile.setUser(alreadyThere);
        theirProfile.setCompany(existing);
        Mockito.when(employerProfileRepository.findByCompanyId(7L))
                .thenReturn(java.util.List.of(theirProfile));

        authService.registerEmployer(request("second@acme.com", "SG-1234"));

        Mockito.verify(notificationService).create(
                Mockito.eq(alreadyThere),
                Mockito.eq("COMPANY_RECRUITER_JOINED"),
                Mockito.anyString(),
                Mockito.contains("second@acme.com"));
    }

    /** The same number typed in a different case is the same company. */
    @Test
    void theLookupIgnoresCase() {
        Mockito.when(companyRepository.findFirstByRegistrationNumberIgnoreCase("sg-1234"))
                .thenReturn(Optional.of(approvedCompany()));

        authService.registerEmployer(request("second@acme.com", "sg-1234"));

        Mockito.verify(companyRepository, Mockito.never()).save(Mockito.any(Company.class));
    }
}

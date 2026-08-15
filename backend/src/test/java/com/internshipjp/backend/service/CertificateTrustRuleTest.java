package com.internshipjp.backend.service;

import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.exception.ForbiddenException;
import com.internshipjp.backend.mapper.CertificateMapper;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.security.AppUserDetails;
import com.internshipjp.backend.storage.FileStorageService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * The certificate trust rule, tested directly.
 *
 * This is the project's one non-negotiable business rule, so it gets its own
 * test class rather than being checked by hand in the browser:
 *
 *   an employer may open a certificate file only when it is VERIFIED
 *   AND the student applied to one of that employer's own internships.
 *
 * Both conditions are tested separately, because a bug that drops either one
 * would still pass a test that only checked the happy path.
 *
 * Owner: Member 1 (testing). The rule itself is Member 4's to extend.
 */
class CertificateTrustRuleTest {

    private static final Long STUDENT_USER_ID = 10L;
    private static final Long STUDENT_PROFILE_ID = 100L;
    private static final Long EMPLOYER_USER_ID = 20L;
    private static final Long COMPANY_ID = 200L;
    private static final Long ADMIN_USER_ID = 30L;
    private static final Long CERTIFICATE_ID = 500L;

    private CertificateRepository certificateRepository;
    private ApplicationRepository applicationRepository;
    private EmployerProfileRepository employerProfileRepository;
    private StudentProfileService studentProfileService;
    private CertificateService certificateService;

    private StudentProfile studentProfile;
    private Certificate certificate;

    @BeforeEach
    void setUp() {
        certificateRepository = Mockito.mock(CertificateRepository.class);
        applicationRepository = Mockito.mock(ApplicationRepository.class);
        employerProfileRepository = Mockito.mock(EmployerProfileRepository.class);
        studentProfileService = Mockito.mock(StudentProfileService.class);

        certificateService = new CertificateService(
                certificateRepository,
                applicationRepository,
                employerProfileRepository,
                studentProfileService,
                Mockito.mock(FileStorageService.class),
                Mockito.mock(NotificationService.class),
                new CertificateMapper());

        User studentUser = user(STUDENT_USER_ID, Role.STUDENT);
        studentProfile = new StudentProfile();
        studentProfile.setId(STUDENT_PROFILE_ID);
        studentProfile.setUser(studentUser);

        certificate = new Certificate();
        certificate.setId(CERTIFICATE_ID);
        certificate.setStudentProfile(studentProfile);
        certificate.setTitle("AWS Cloud Practitioner");
        certificate.setVerificationStatus(VerificationStatus.VERIFIED);
        certificate.setOriginalFileName("aws.pdf");
        certificate.setMimeType("application/pdf");
        certificate.setStoragePath("certificates/100/abc.pdf");

        Mockito.when(certificateRepository.findById(CERTIFICATE_ID))
                .thenReturn(Optional.of(certificate));

        Company company = new Company();
        company.setId(COMPANY_ID);
        EmployerProfile employerProfile = new EmployerProfile();
        employerProfile.setUser(user(EMPLOYER_USER_ID, Role.EMPLOYER));
        employerProfile.setCompany(company);
        Mockito.when(employerProfileRepository.findByUserId(EMPLOYER_USER_ID))
                .thenReturn(Optional.of(employerProfile));
    }

    private User user(Long id, Role role) {
        User user = new User();
        user.setId(id);
        user.setEmail("user" + id + "@test.local");
        user.setFullName("User " + id);
        user.setPasswordHash("irrelevant");
        user.setRole(role);
        user.setAccountStatus(AccountStatus.ACTIVE);
        return user;
    }

    private AppUserDetails caller(Long id, Role role) {
        return new AppUserDetails(user(id, role));
    }

    // ------------------------------------------------------------- employer

    @Test
    void employerMayOpenAVerifiedCertificateOfTheirOwnApplicant() {
        Mockito.when(applicationRepository
                        .existsByStudentProfileIdAndInternship_Company_Id(STUDENT_PROFILE_ID, COMPANY_ID))
                .thenReturn(true);

        Certificate allowed = certificateService
                .requireDownloadAccess(caller(EMPLOYER_USER_ID, Role.EMPLOYER), CERTIFICATE_ID);

        assertSame(certificate, allowed);
    }

    @Test
    void employerIsRefusedAPendingCertificateEvenForTheirOwnApplicant() {
        certificate.setVerificationStatus(VerificationStatus.PENDING);
        Mockito.when(applicationRepository
                        .existsByStudentProfileIdAndInternship_Company_Id(STUDENT_PROFILE_ID, COMPANY_ID))
                .thenReturn(true);

        assertThrows(ForbiddenException.class, () -> certificateService
                .requireDownloadAccess(caller(EMPLOYER_USER_ID, Role.EMPLOYER), CERTIFICATE_ID));
    }

    @Test
    void employerIsRefusedARejectedCertificate() {
        certificate.setVerificationStatus(VerificationStatus.REJECTED);
        Mockito.when(applicationRepository
                        .existsByStudentProfileIdAndInternship_Company_Id(STUDENT_PROFILE_ID, COMPANY_ID))
                .thenReturn(true);

        assertThrows(ForbiddenException.class, () -> certificateService
                .requireDownloadAccess(caller(EMPLOYER_USER_ID, Role.EMPLOYER), CERTIFICATE_ID));
    }

    @Test
    void employerIsRefusedAVerifiedCertificateOfSomeoneWhoNeverApplied() {
        // Verified is not enough on its own - this is the check that stops an
        // employer browsing the qualifications of the entire student body.
        Mockito.when(applicationRepository
                        .existsByStudentProfileIdAndInternship_Company_Id(STUDENT_PROFILE_ID, COMPANY_ID))
                .thenReturn(false);

        assertThrows(ForbiddenException.class, () -> certificateService
                .requireDownloadAccess(caller(EMPLOYER_USER_ID, Role.EMPLOYER), CERTIFICATE_ID));
    }

    // -------------------------------------------------------------- student

    @Test
    void studentMayOpenTheirOwnPendingCertificate() {
        certificate.setVerificationStatus(VerificationStatus.PENDING);
        Mockito.when(studentProfileService.requireProfileByUserId(STUDENT_USER_ID))
                .thenReturn(studentProfile);

        Certificate allowed = certificateService
                .requireDownloadAccess(caller(STUDENT_USER_ID, Role.STUDENT), CERTIFICATE_ID);

        assertSame(certificate, allowed);
    }

    @Test
    void studentIsRefusedAnotherStudentsCertificate() {
        StudentProfile otherStudent = new StudentProfile();
        otherStudent.setId(999L);
        otherStudent.setUser(user(11L, Role.STUDENT));
        Mockito.when(studentProfileService.requireProfileByUserId(11L)).thenReturn(otherStudent);

        assertThrows(ForbiddenException.class, () -> certificateService
                .requireDownloadAccess(caller(11L, Role.STUDENT), CERTIFICATE_ID));
    }

    // ---------------------------------------------------------------- admin

    @Test
    void adminMayOpenAnyCertificateInAnyStatus() {
        certificate.setVerificationStatus(VerificationStatus.REJECTED);

        Certificate allowed = certificateService
                .requireDownloadAccess(caller(ADMIN_USER_ID, Role.ADMIN), CERTIFICATE_ID);

        assertSame(certificate, allowed);
    }

    // ------------------------------------------ the employer-facing list

    @Test
    void theEmployerFacingListAsksTheRepositoryForVerifiedRowsOnly() {
        Mockito.when(certificateRepository.findByStudentProfileIdAndVerificationStatus(
                        STUDENT_PROFILE_ID, VerificationStatus.VERIFIED))
                .thenReturn(List.of(certificate));

        assertEquals(1, certificateService.verifiedCertificatesOf(STUDENT_PROFILE_ID).size());

        // The status is not a parameter the caller can change: it is fixed
        // inside the service, so no endpoint can ask for pending rows.
        Mockito.verify(certificateRepository)
                .findByStudentProfileIdAndVerificationStatus(STUDENT_PROFILE_ID, VerificationStatus.VERIFIED);
        Mockito.verify(certificateRepository, Mockito.never())
                .findByStudentProfileIdOrderByCreatedAtDesc(Mockito.anyLong());
    }
}

package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.CertificateUploadRequest;
import com.internshipjp.backend.dto.request.CertificateVerificationRequest;
import com.internshipjp.backend.dto.response.CertificateResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.ForbiddenException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.CertificateMapper;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.security.AppUserDetails;
import com.internshipjp.backend.storage.FileStorageService;
import com.internshipjp.backend.storage.StoredFile;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Certificates: upload, review, and the rule that decides who may see what.
 *
 * ============================ THE TRUST RULE ============================
 * A certificate is evidence only when verificationStatus == VERIFIED.
 *
 *   Student  sees all of their own certificates, in any status.
 *   Admin    sees every certificate, in any status.
 *   Employer sees VERIFIED certificates only, and only for a student who has
 *            applied to an internship owned by the employer's company.
 *
 * This is enforced here, in the backend. Hiding a row in React is not
 * security: anyone can call the API directly.
 * =======================================================================
 */
@Service
public class CertificateService {

    private final CertificateRepository certificateRepository;
    private final ApplicationRepository applicationRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final StudentProfileService studentProfileService;
    private final FileStorageService fileStorageService;
    private final NotificationService notificationService;
    private final CertificateMapper certificateMapper;

    public CertificateService(CertificateRepository certificateRepository,
                              ApplicationRepository applicationRepository,
                              EmployerProfileRepository employerProfileRepository,
                              StudentProfileService studentProfileService,
                              FileStorageService fileStorageService,
                              NotificationService notificationService,
                              CertificateMapper certificateMapper) {
        this.certificateRepository = certificateRepository;
        this.applicationRepository = applicationRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.studentProfileService = studentProfileService;
        this.fileStorageService = fileStorageService;
        this.notificationService = notificationService;
        this.certificateMapper = certificateMapper;
    }

    // ---------------------------------------------------------------- student

    @Transactional(readOnly = true)
    public List<CertificateResponse> listOwn(Long userId) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        return certificateRepository.findByStudentProfileIdOrderByCreatedAtDesc(profile.getId())
                .stream().map(certificateMapper::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public CertificateResponse getOwn(Long userId, Long certificateId) {
        return certificateMapper.toResponse(requireOwnCertificate(userId, certificateId));
    }

    /**
     * Saves the file first, then the row. New certificates are always PENDING -
     * a student can never upload something that is already "verified".
     */
    @Transactional
    public CertificateResponse upload(Long userId, CertificateUploadRequest request, MultipartFile file) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        StoredFile stored = fileStorageService.store(file, "certificates", profile.getId());

        Certificate certificate = new Certificate();
        certificate.setStudentProfile(profile);
        certificate.setTitle(request.getTitle().trim());
        certificate.setIssuingOrganization(request.getIssuingOrganization());
        certificate.setIssueDate(request.getIssueDate());
        certificate.setOriginalFileName(stored.getOriginalFileName());
        certificate.setStoredFileName(stored.getStoredFileName());
        certificate.setStoragePath(stored.getStoragePath());
        certificate.setMimeType(stored.getMimeType());
        certificate.setFileSize(stored.getSize());
        certificate.setVerificationStatus(VerificationStatus.PENDING);

        Certificate saved = certificateRepository.save(certificate);

        notificationService.notifyAdmins(
                "CERTIFICATE_VERIFICATION_REQUESTED",
                "Certificate waiting for verification",
                profile.getUser().getFullName() + " uploaded \"" + saved.getTitle() + "\".");

        return certificateMapper.toResponse(saved);
    }

    @Transactional
    public void deleteOwn(Long userId, Long certificateId) {
        Certificate certificate = requireOwnCertificate(userId, certificateId);
        // Remove the row first: if the file delete fails we still have no
        // dangling record pointing at a file the student thinks is gone.
        certificateRepository.delete(certificate);
        fileStorageService.delete(certificate.getStoragePath());
    }

    // ------------------------------------------------------------------ admin

    @Transactional(readOnly = true)
    public PageResponse<CertificateResponse> listPending(Pageable pageable) {
        return PageResponse.from(
                certificateRepository.findByVerificationStatus(VerificationStatus.PENDING, pageable),
                certificateMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public CertificateResponse getForAdmin(Long certificateId) {
        return certificateMapper.toResponse(requireCertificate(certificateId));
    }

    /**
     * Records an administrator's decision and tells the student.
     *
     * TODO MEMBER_4: extend the audit trail here - keep every decision rather
     * than only the latest one, and add MORE_INFO_REQUIRED handling.
     */
    @Transactional
    public CertificateResponse verify(Long adminUserId, Long certificateId,
                                      CertificateVerificationRequest request) {
        Certificate certificate = requireCertificate(certificateId);
        VerificationStatus decision = VerificationStatus.valueOf(request.getStatus());

        if (decision == VerificationStatus.PENDING) {
            throw new BadRequestException("A review must result in VERIFIED or REJECTED.");
        }

        certificate.setVerificationStatus(decision);
        certificate.setVerificationNote(request.getNote());
        certificate.setVerifiedBy(adminUserId);
        certificate.setVerifiedAt(LocalDateTime.now());
        Certificate saved = certificateRepository.save(certificate);

        notificationService.create(
                certificate.getStudentProfile().getUser(),
                "CERTIFICATE_" + decision.name(),
                "Certificate " + decision.name().toLowerCase(),
                "\"" + certificate.getTitle() + "\" was reviewed by an administrator.");

        return certificateMapper.toResponse(saved);
    }

    // --------------------------------------------------------------- employer

    /**
     * The only method employer-facing code may use to read certificates.
     * It cannot return a PENDING or REJECTED row.
     */
    @Transactional(readOnly = true)
    public List<CertificateResponse> verifiedCertificatesOf(Long studentProfileId) {
        return certificateRepository
                .findByStudentProfileIdAndVerificationStatus(studentProfileId, VerificationStatus.VERIFIED)
                .stream().map(certificateMapper::toResponse).toList();
    }

    // --------------------------------------------------------------- download

    /**
     * Decides whether the caller may download this certificate file, and
     * returns the entity if so. Called by the download endpoint before a
     * single byte is read from disk.
     */
    @Transactional(readOnly = true)
    public Certificate requireDownloadAccess(AppUserDetails caller, Long certificateId) {
        Certificate certificate = requireCertificate(certificateId);
        Long ownerProfileId = certificate.getStudentProfile().getId();

        if (caller.getRole() == Role.ADMIN) {
            return certificate;
        }

        if (caller.getRole() == Role.STUDENT) {
            StudentProfile profile = studentProfileService.requireProfileByUserId(caller.getId());
            if (!profile.getId().equals(ownerProfileId)) {
                throw new ForbiddenException("This certificate belongs to another student.");
            }
            return certificate;
        }

        if (caller.getRole() == Role.EMPLOYER) {
            // Two conditions, both required.
            if (certificate.getVerificationStatus() != VerificationStatus.VERIFIED) {
                throw new ForbiddenException(
                        "Only verified certificates are available to employers.");
            }
            Long companyId = employerProfileRepository.findByUserId(caller.getId())
                    .orElseThrow(() -> new ForbiddenException("Your employer profile is incomplete."))
                    .getCompany().getId();
            boolean applied = applicationRepository
                    .existsByStudentProfileIdAndInternship_Company_Id(ownerProfileId, companyId);
            if (!applied) {
                throw new ForbiddenException(
                        "This student has not applied to any of your internships.");
            }
            return certificate;
        }

        throw new ForbiddenException("Your role cannot open certificate files.");
    }

    // ---------------------------------------------------------------- helpers

    private Certificate requireCertificate(Long certificateId) {
        return certificateRepository.findById(certificateId)
                .orElseThrow(() -> NotFoundException.of("Certificate", certificateId));
    }

    private Certificate requireOwnCertificate(Long userId, Long certificateId) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        return certificateRepository.findByIdAndStudentProfileId(certificateId, profile.getId())
                .orElseThrow(() -> NotFoundException.of("Certificate", certificateId));
    }
}

package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.CreateApplicationRequest;
import com.internshipjp.backend.dto.request.UpdateApplicationStatusRequest;
import com.internshipjp.backend.dto.response.ApplicationDetailResponse;
import com.internshipjp.backend.dto.response.ApplicationSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.Application;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.entity.ApplicationStatus;
import com.internshipjp.backend.entity.ApplicationStatusHistory;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.ConflictException;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.ApplicationMapper;
import com.internshipjp.backend.mapper.InternshipMapper;
import com.internshipjp.backend.mapper.StudentMapper;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.ApplicationStatusHistoryRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Applying to internships, and reviewing applicants.
 *
 * The duplicate-application rule lives in two places on purpose:
 *   - here, so the student gets a readable 409 message;
 *   - in the database (uk_application_once), so a double-click or a second
 *     server instance still cannot create two rows.
 *
 * TODO MEMBER_3: yours to extend - withdrawing an application, interview
 * scheduling, bulk shortlisting, and the "positions filled" rule.
 */
@Service
public class ApplicationService {

    /**
     * Which status may follow which. Anything not listed is rejected, so a
     * REJECTED application can never quietly become ACCEPTED again.
     */
    private static final Map<ApplicationStatus, List<ApplicationStatus>> ALLOWED_TRANSITIONS = Map.of(
            ApplicationStatus.APPLIED, List.of(
                    ApplicationStatus.UNDER_REVIEW, ApplicationStatus.SHORTLISTED, ApplicationStatus.REJECTED),
            ApplicationStatus.UNDER_REVIEW, List.of(
                    ApplicationStatus.SHORTLISTED, ApplicationStatus.INTERVIEW, ApplicationStatus.REJECTED),
            ApplicationStatus.SHORTLISTED, List.of(
                    ApplicationStatus.INTERVIEW, ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED),
            ApplicationStatus.INTERVIEW, List.of(
                    ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED),
            ApplicationStatus.ACCEPTED, List.of(),
            ApplicationStatus.REJECTED, List.of(),
            ApplicationStatus.WITHDRAWN, List.of());

    private final ApplicationRepository applicationRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentProfileService studentProfileService;
    private final InternshipService internshipService;
    private final EmployerService employerService;
    private final CertificateService certificateService;
    private final NotificationService notificationService;
    private final ApplicationMapper applicationMapper;
    private final InternshipMapper internshipMapper;
    private final StudentMapper studentMapper;

    public ApplicationService(ApplicationRepository applicationRepository,
                              ApplicationStatusHistoryRepository historyRepository,
                              StudentSkillRepository studentSkillRepository,
                              StudentProfileService studentProfileService,
                              InternshipService internshipService,
                              EmployerService employerService,
                              CertificateService certificateService,
                              NotificationService notificationService,
                              ApplicationMapper applicationMapper,
                              InternshipMapper internshipMapper,
                              StudentMapper studentMapper) {
        this.applicationRepository = applicationRepository;
        this.historyRepository = historyRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentProfileService = studentProfileService;
        this.internshipService = internshipService;
        this.employerService = employerService;
        this.certificateService = certificateService;
        this.notificationService = notificationService;
        this.applicationMapper = applicationMapper;
        this.internshipMapper = internshipMapper;
        this.studentMapper = studentMapper;
    }

    // ---------------------------------------------------------------- student

    @Transactional
    public ApplicationSummaryResponse apply(Long userId, Long internshipId,
                                            CreateApplicationRequest request) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        Internship internship = internshipService.requireInternship(internshipId);

        if (internship.getStatus() != InternshipStatus.OPEN) {
            throw new BadRequestException("This internship is not accepting applications.");
        }
        if (internship.getApplicationDeadline() != null
                && internship.getApplicationDeadline().isBefore(LocalDate.now())) {
            throw new BadRequestException("The deadline for this internship has passed.");
        }
        if (applicationRepository.existsByInternshipIdAndStudentProfileId(internshipId, profile.getId())) {
            throw new ConflictException("You have already applied to this internship.");
        }

        Application application = new Application();
        application.setInternship(internship);
        application.setStudentProfile(profile);
        application.setCoverLetter(request.getCoverLetter());
        application.setResumeId(request.getResumeId());
        application.setStatus(ApplicationStatus.APPLIED);
        Application saved = applicationRepository.save(application);

        recordHistory(saved, null, ApplicationStatus.APPLIED, userId, "Application submitted");

        return applicationMapper.toSummary(saved);
    }

    @Transactional(readOnly = true)
    public PageResponse<ApplicationSummaryResponse> listOwn(Long userId, Pageable pageable) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        return PageResponse.from(
                applicationRepository.findByStudentProfileIdOrderByCreatedAtDesc(profile.getId(), pageable),
                applicationMapper::toSummary);
    }

    // --------------------------------------------------------------- employer

    @Transactional(readOnly = true)
    public PageResponse<ApplicationSummaryResponse> listForOwnInternship(Long userId, Long internshipId,
                                                                         Pageable pageable) {
        // Throws if the internship belongs to a different company.
        Internship internship = internshipService.requireOwnInternship(userId, internshipId);
        return PageResponse.from(
                applicationRepository.findByInternshipId(internship.getId(), pageable),
                applicationMapper::toSummary);
    }

    /**
     * The applicant review screen.
     *
     * Note where the certificates come from: CertificateService's verified-only
     * method. There is no code path here that could return a PENDING one.
     */
    @Transactional(readOnly = true)
    public ApplicationDetailResponse getForOwnCompany(Long userId, Long applicationId) {
        Application application = requireOwnApplication(userId, applicationId);
        StudentProfile student = application.getStudentProfile();

        ApplicationDetailResponse dto = new ApplicationDetailResponse();
        dto.setId(application.getId());
        dto.setStatus(application.getStatus().name());
        dto.setCoverLetter(application.getCoverLetter());
        dto.setCreatedAt(application.getCreatedAt() == null ? null : application.getCreatedAt().toString());
        dto.setUpdatedAt(application.getUpdatedAt() == null ? null : application.getUpdatedAt().toString());
        dto.setInternship(internshipMapper.toSummary(application.getInternship()));
        dto.setStudent(studentMapper.toProfile(student));
        dto.setSkills(studentSkillRepository.findByStudentProfileIdOrderByNameAsc(student.getId())
                .stream().map(studentMapper::toSkill).toList());
        dto.setVerifiedCertificates(certificateService.verifiedCertificatesOf(student.getId()));
        dto.setStatusHistory(historyRepository.findByApplicationIdOrderByCreatedAtAsc(application.getId())
                .stream().map(applicationMapper::toHistory).toList());
        return dto;
    }

    @Transactional
    public ApplicationSummaryResponse updateStatus(Long userId, Long applicationId,
                                                   UpdateApplicationStatusRequest request) {
        Application application = requireOwnApplication(userId, applicationId);
        ApplicationStatus from = application.getStatus();
        ApplicationStatus to = ApplicationStatus.valueOf(request.getStatus());

        if (from == to) {
            throw new BadRequestException("The application is already " + to.name() + ".");
        }
        if (!ALLOWED_TRANSITIONS.getOrDefault(from, List.of()).contains(to)) {
            throw new BadRequestException(
                    "An application cannot move from " + from.name() + " to " + to.name() + ".");
        }

        application.setStatus(to);
        application.setDecidedBy(userId);
        application.setDecidedAt(LocalDateTime.now());
        Application saved = applicationRepository.save(application);

        recordHistory(saved, from, to, userId, request.getNote());

        notificationService.create(
                application.getStudentProfile().getUser(),
                "APPLICATION_STATUS_CHANGED",
                "Your application was updated",
                "\"" + application.getInternship().getTitle() + "\" is now "
                        + to.name().toLowerCase().replace('_', ' ') + ".");

        return applicationMapper.toSummary(saved);
    }

    // ---------------------------------------------------------------- helpers

    /**
     * Sends a note from the employer to the applicant.
     *
     * requireOwnApplication is what makes this safe: an employer can only
     * message someone who applied to their own company's vacancy. Without it,
     * any application id would reach any student.
     *
     * The vacancy title is put in the notification because a student may have
     * applied to several, and "please send your transcript" means nothing
     * without knowing which role is asking.
     */
    @Transactional
    public void messageApplicant(Long userId, Long applicationId, String message) {
        Application application = requireOwnApplication(userId, applicationId);
        User student = application.getStudentProfile().getUser();
        String company = application.getInternship().getCompany().getName();

        notificationService.create(
                student,
                "APPLICATION_MESSAGE",
                company + " asked about your application",
                "Regarding \"" + application.getInternship().getTitle() + "\": " + message);
    }

    private Application requireOwnApplication(Long userId, Long applicationId) {
        EmployerProfile profile = employerService.requireProfile(userId);
        return applicationRepository
                .findByIdAndInternship_Company_Id(applicationId, profile.getCompany().getId())
                .orElseThrow(() -> NotFoundException.of("Application", applicationId));
    }

    private void recordHistory(Application application, ApplicationStatus from,
                               ApplicationStatus to, Long changedBy, String note) {
        ApplicationStatusHistory history = new ApplicationStatusHistory();
        history.setApplication(application);
        history.setFromStatus(from);
        history.setToStatus(to);
        history.setChangedBy(changedBy);
        history.setNote(note);
        historyRepository.save(history);
    }
}

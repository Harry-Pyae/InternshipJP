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
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.repository.InternshipRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.internshipjp.backend.repository.EmployerProfileRepository;
import com.internshipjp.backend.entity.ApplicationSkill;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.repository.ApplicationSkillRepository;
import com.internshipjp.backend.entity.ApplicationMessage;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.repository.ApplicationMessageRepository;
import com.internshipjp.backend.dto.response.ApplicationMessageResponse;
import com.internshipjp.backend.repository.UserRepository;
import com.internshipjp.backend.util.Dates;

/**
 * Applying to internships, and reviewing applicants.
 *
 * The duplicate-application rule lives in two places on purpose:
 *   - here, so the student gets a readable 409 message;
 *   - in the database (uk_application_once), so a double-click or a second
 *     server instance still cannot create two rows.
 *
 * Future work: withdrawing an application, interview
 * scheduling, bulk shortlisting, and the "positions filled" rule.
 */
@Service
public class ApplicationService {

    private static final Logger log = LoggerFactory.getLogger(ApplicationService.class);

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
    private final InternshipRepository internshipRepository;
    private final EmployerProfileRepository employerProfileRepository;
    private final ApplicationStatusHistoryRepository historyRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final ApplicationSkillRepository applicationSkillRepository;
    private final ApplicationMessageRepository applicationMessageRepository;
    private final UserRepository userRepository;
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
                              StudentMapper studentMapper,
                              InternshipRepository internshipRepository,
                              EmployerProfileRepository employerProfileRepository,
                              ApplicationSkillRepository applicationSkillRepository,
                              ApplicationMessageRepository applicationMessageRepository,
                              UserRepository userRepository) {
        this.userRepository = userRepository;
        this.applicationMessageRepository = applicationMessageRepository;
        this.applicationSkillRepository = applicationSkillRepository;
        this.employerProfileRepository = employerProfileRepository;
        this.internshipRepository = internshipRepository;
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

        // The skills as they are right now, copied onto the application.
        //
        // The employer's view used to read the student's current skills, so a
        // student could apply, then add five more, and the employer would see
        // them attached to an application that was never made with them. An
        // application is a statement about a person at a moment.
        for (StudentSkill skill
                : studentSkillRepository.findByStudentProfileIdOrderByNameAsc(profile.getId())) {
            ApplicationSkill recorded = new ApplicationSkill();
            recorded.setApplication(saved);
            recorded.setName(skill.getName());
            recorded.setSkillType(skill.getSkillType());
            recorded.setProficiency(skill.getProficiency());
            applicationSkillRepository.save(recorded);
        }

        recordHistory(saved, null, ApplicationStatus.APPLIED, userId, "Application submitted");

        // Every notification in the system went to a student or an
        // administrator. An employer was never told anything - not even that
        // somebody had applied to their own vacancy, which is the one thing
        // they are waiting for.
        notifyRecruiters(internship,
                "APPLICATION_RECEIVED",
                "A new application",
                profile.getUser().getFullName() + " applied for \""
                        + internship.getTitle() + "\".",
                saved.getId());

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
     * Every applicant across this employer's vacancies.
     *
     * The per-vacancy list answers "who applied to this one". This answers
     * "who has applied at all", which is the question an employer with several
     * openings actually starts from - and previously could only answer by
     * stepping through each vacancy in turn.
     *
     * Scoped to the company, so ownership is enforced by the query rather than
     * by a check that could be forgotten: an employer can only ever reach rows
     * belonging to their own organisation.
     */
    @Transactional(readOnly = true)
    public PageResponse<ApplicationSummaryResponse> listForOwnCompany(Long userId, Pageable pageable) {
        Company company = employerService.requireApprovedCompany(userId);
        return PageResponse.from(
                applicationRepository.findByInternshipCompanyIdOrderByCreatedAtDesc(
                        company.getId(), pageable),
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
        // What was recorded with the application, not what the profile says
        // today. Applications made before the snapshot existed have no rows, so
        // those fall back to the live skills - the behaviour they were created
        // under, and the only honest thing to show for them.
        List<ApplicationSkill> recorded =
                applicationSkillRepository.findByApplicationIdOrderByNameAsc(application.getId());
        dto.setSkills(recorded.isEmpty()
                ? studentSkillRepository.findByStudentProfileIdOrderByNameAsc(student.getId())
                        .stream().map(studentMapper::toSkill).toList()
                : recorded.stream().map(studentMapper::toSkill).toList());
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

        // A vacancy advertises a number of places. Nothing counted acceptances
        // against it, so an employer could accept twenty people for one place
        // and the vacancy stayed open to new applicants throughout.
        if (to == ApplicationStatus.ACCEPTED) {
            Internship target = application.getInternship();
            // A primitive int, so it is 0 rather than null when never set.
            // Treating 0 as one place stops a vacancy closing on its first
            // acceptance because nobody typed a number.
            int places = Math.max(1, target.getAvailablePositions());
            long taken = applicationRepository.countByInternshipIdAndStatus(
                    target.getId(), ApplicationStatus.ACCEPTED);
            if (taken >= places) {
                throw new BadRequestException(
                        "Every place on this vacancy is already taken. Reopen it with more "
                                + "positions if you want to accept somebody else.");
            }
        }

        application.setStatus(to);
        application.setDecidedBy(userId);
        application.setDecidedAt(LocalDateTime.now());
        Application saved = applicationRepository.save(application);

        recordHistory(saved, from, to, userId, request.getNote());

        // The employer's note was already written to the history table and then
        // left there: the student was told the status had changed and never
        // why. The reason existed in the database and was invisible to the one
        // person it was written for.
        notificationService.create(
                application.getStudentProfile().getUser(),
                "APPLICATION_STATUS_CHANGED",
                "Your application was updated",
                statusMessage(application.getInternship().getTitle(),
                        to,
                        employerName(application),
                        request.getNote()),
                application.getId());

        if (to == ApplicationStatus.ACCEPTED) {
            closeIfFull(application.getInternship(), userId);
        }

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

        recordMessage(application, application.getInternship().getCreatedBy(), Role.EMPLOYER, message);

        notificationService.create(
                student,
                "APPLICATION_MESSAGE",
                company + " asked about your application",
                "Regarding \"" + application.getInternship().getTitle() + "\"\n\u201c" + message + "\u201d",
                application.getId());
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

    /**
     * Closes a vacancy once its last place is taken, and tells the rest.
     *
     * WHY THE OTHERS ARE DECIDED RATHER THAN LEFT OPEN
     *   Their applications cannot succeed any more. Leaving them under review
     *   would have people waiting on a decision that can no longer go their
     *   way, and would leave the employer a queue with nothing left to decide.
     *
     * WHY THE VACANCY IS MARKED FILLED RATHER THAN DELETED
     *   Every application points at it, and so does the history behind each
     *   one. FILLED records what happened; removing the row would take the
     *   record of everybody who applied with it.
     *
     * FILLED is not OPEN, so the vacancy leaves the browse list and apply()
     * refuses it - both already test for OPEN, so neither needed changing.
     */
    private void closeIfFull(Internship internship, Long decidedBy) {
        int places = Math.max(1, internship.getAvailablePositions());
        long taken = applicationRepository.countByInternshipIdAndStatus(
                internship.getId(), ApplicationStatus.ACCEPTED);
        if (taken < places) {
            return;
        }

        internship.setStatus(InternshipStatus.FILLED);
        internshipRepository.save(internship);

        List<Application> waiting = applicationRepository.findByInternshipIdAndStatusNotIn(
                internship.getId(),
                List.of(ApplicationStatus.ACCEPTED, ApplicationStatus.REJECTED));

        for (Application other : waiting) {
            ApplicationStatus before = other.getStatus();
            other.setStatus(ApplicationStatus.REJECTED);
            other.setDecidedBy(decidedBy);
            other.setDecidedAt(LocalDateTime.now());
            Application closed = applicationRepository.save(other);

            recordHistory(closed, before, ApplicationStatus.REJECTED, decidedBy,
                    "The position was filled.");

            // Worded so it does not read as a judgement of the person. It was
            // not one.
            notificationService.create(
                    other.getStudentProfile().getUser(),
                    "APPLICATION_STATUS_CHANGED",
                    "The position has been filled",
                    "\"" + internship.getTitle() + "\" at "
                            + internship.getCompany().getName()
                            + " has been filled, so your application was not taken further. "
                            + "The places ran out - it was not a decision about you.",
                other.getId());
        }

        log.info("Vacancy {} filled: {} place(s) taken, {} other application(s) closed",
                internship.getId(), taken, waiting.size());
    }

    /**
     * A student replying to the employer on their own application.
     *
     * The mirror of messageApplicant. An employer could ask a question and the
     * student had no way to answer it inside the system - they would have had
     * to find an address somewhere else, which is exactly what the platform is
     * meant to avoid.
     *
     * Ownership is checked from the student's side: the application must
     * belong to the profile behind this account, so nobody can post a message
     * onto somebody else's application by changing the number in the URL.
     */
    @Transactional
    public void messageEmployer(Long userId, Long applicationId, String message) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> NotFoundException.of("Application", applicationId));

        if (!application.getStudentProfile().getId().equals(profile.getId())) {
            // The same error as a missing one, deliberately: telling somebody
            // that an application exists but is not theirs confirms it exists.
            throw NotFoundException.of("Application", applicationId);
        }

        recordMessage(application, userId, Role.STUDENT, message);

        notifyRecruiters(application.getInternship(),
                "APPLICATION_MESSAGE",
                profile.getUser().getFullName() + " replied about their application",
                "Regarding \"" + application.getInternship().getTitle() + "\"\n\u201c" + message + "\u201d",
                application.getId());
    }

    /**
     * Tells everybody recruiting for this vacancy's company.
     *
     * The company rather than whoever posted it, for the same reason the
     * applicant list is scoped that way: a vacancy belongs to the
     * organisation, and if the person who posted it leaves, the applications
     * must still reach somebody.
     */
    private void notifyRecruiters(Internship internship, String type,
                                  String title, String message, Long referenceId) {
        if (internship.getCompany() == null) {
            return;
        }
        for (EmployerProfile recruiter
                : employerProfileRepository.findByCompanyId(internship.getCompany().getId())) {
            if (recruiter.getUser() != null) {
                notificationService.create(recruiter.getUser(), type, title, message,
                        referenceId);
            }
        }
    }

    /**
     * Keeps what was said, beside the application it was said about.
     *
     * A notification belongs to one recipient, so an inbox holds only the
     * messages sent to that person. Storing the message here is what lets both
     * sides read the exchange in order, and what makes the thread survive the
     * notification being marked read or cleared.
     */
    private void recordMessage(Application application, Long senderId, Role senderRole,
                               String body) {
        User sender = userRepository.findById(senderId).orElse(null);
        if (sender == null) {
            return;
        }
        ApplicationMessage entry = new ApplicationMessage();
        entry.setApplication(application);
        entry.setSender(sender);
        entry.setSenderRole(senderRole);
        entry.setBody(body.trim());
        applicationMessageRepository.save(entry);
    }

    /**
     * The exchange, checked from the student's side.
     *
     * Ownership is proved here rather than trusted: the application must belong
     * to the profile behind this account, and a mismatch reads as not found,
     * because saying it exists but is not yours confirms it exists.
     */
    @Transactional(readOnly = true)
    public List<ApplicationMessageResponse> threadForStudent(Long userId, Long applicationId) {
        StudentProfile profile = studentProfileService.requireProfileByUserId(userId);
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> NotFoundException.of("Application", applicationId));
        if (!application.getStudentProfile().getId().equals(profile.getId())) {
            throw NotFoundException.of("Application", applicationId);
        }
        return threadOf(applicationId);
    }

    /**
     * The exchange about one application.
     *
     * Ownership is checked by the caller - both the employer and the student
     * route reach this through a finder that already proves the application is
     * theirs.
     */
    @Transactional(readOnly = true)
    public List<ApplicationMessageResponse> threadOf(Long applicationId) {
        return applicationMessageRepository
                .findByApplicationIdOrderByCreatedAtAsc(applicationId)
                .stream()
                .map(entry -> {
                    ApplicationMessageResponse dto = new ApplicationMessageResponse();
                    dto.setId(entry.getId());
                    dto.setSenderName(entry.getSender().getFullName());
                    dto.setSenderRole(entry.getSenderRole().name());
                    dto.setBody(entry.getBody());
                    dto.setCreatedAt(Dates.format(entry.getCreatedAt()));
                    return dto;
                })
                .toList();
    }

    /** The company name, for attributing a note to somebody rather than nobody. */
    private String employerName(Application application) {
        return application.getInternship().getCompany().getName();
    }

    /**
     * What the student is told when a status changes.
     *
     * Package-private and static so the rule can be tested on its own: the
     * employer's note was previously written to the history table and never
     * sent, so the student learned that something had changed and never why.
     */
    static String statusMessage(String title, ApplicationStatus to, String company, String note) {
        String message = "\"" + title + "\" is now "
                + to.name().toLowerCase().replace('_', ' ') + ".";
        String trimmed = note == null ? "" : note.trim();
        if (!trimmed.isEmpty()) {
            // On its own line, and quoted.
            //
            // Run together, the two read as one sentence - "is now rejected.
            // Demo Yangon Tech wrote: You are now rejected." - and the reader
            // has to work out where the system stops speaking and the employer
            // starts. They are different kinds of fact: one is what happened,
            // the other is what a person said about it.
            message = message + "\n" + company + " wrote: \u201c" + trimmed + "\u201d";
        }
        return message;
    }
}

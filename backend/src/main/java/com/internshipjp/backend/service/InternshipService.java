package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.request.InternshipRequest;
import com.internshipjp.backend.dto.response.InternshipDetailResponse;
import com.internshipjp.backend.dto.response.InternshipSummaryResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.EmployerProfile;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.WorkMode;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.InternshipMapper;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.LinkedHashSet;
import java.util.Locale;
import java.util.Set;
import java.time.LocalDate;
import com.internshipjp.backend.repository.ApplicationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Internship listing (public) and internship management (employer).
 *
 * Future work. Still to add:
 *   - filtering by work mode, location and stipend range on the public list
 *     (it searches title, company and location by keyword today)
 *   - closing an internship automatically when the deadline passes; the
 *     deadline is enforced when somebody applies, but the vacancy stays OPEN
 *
 * Two items that used to head this list are done: the required-skills editor
 * is replaceSkills() below, and "positions filled" is
 * ApplicationService.closeIfFull().
 */
@Service
public class InternshipService {

    private static final Logger log = LoggerFactory.getLogger(InternshipService.class);



    /** Statuses a student is allowed to open by direct link. */
    private static final List<InternshipStatus> PUBLICLY_VISIBLE =
            List.of(InternshipStatus.OPEN, InternshipStatus.CLOSED, InternshipStatus.FILLED);

    private final InternshipRepository internshipRepository;
    private final ApplicationRepository applicationRepository;
    private final InternshipSkillRepository internshipSkillRepository;
    private final EmployerService employerService;
    private final InternshipMapper internshipMapper;

    public InternshipService(InternshipRepository internshipRepository,
                             InternshipSkillRepository internshipSkillRepository,
                             EmployerService employerService,
                             InternshipMapper internshipMapper,
                             ApplicationRepository applicationRepository) {
        this.applicationRepository = applicationRepository;
        this.internshipRepository = internshipRepository;
        this.internshipSkillRepository = internshipSkillRepository;
        this.employerService = employerService;
        this.internshipMapper = internshipMapper;
    }

    @Transactional(readOnly = true)
public PageResponse<InternshipSummaryResponse> listForAdmin(
        String keyword,
        String status,
        Pageable pageable) {

    Page<Internship> page;

    InternshipStatus internshipStatus = null;

    if (StringUtils.hasText(status)) {
        try {
            internshipStatus = InternshipStatus.valueOf(
                    status.trim().toUpperCase()
            );
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException(
                    "Invalid internship status: " + status
            );
        }
    }

    if (internshipStatus != null && StringUtils.hasText(keyword)) {

        String search = keyword.trim();

        page = internshipRepository.findByStatusAndKeyword(
                internshipStatus,
                search,
                pageable
        );

    } else if (internshipStatus != null) {

        page = internshipRepository.findByStatus(
                internshipStatus,
                pageable
        );

    } else if (StringUtils.hasText(keyword)) {

        page = internshipRepository.searchAll(
                keyword.trim(),
                pageable
        );

    } else {

        page = internshipRepository.findAll(pageable);
    }

    return PageResponse.from(page, internshipMapper::toSummary);
}

    // ----------------------------------------------------------------- public

    /** Only OPEN internships appear in the public list. */
    @Transactional(readOnly = true)
    public PageResponse<InternshipSummaryResponse> listOpen(String keyword, Pageable pageable) {
        Page<Internship> page = StringUtils.hasText(keyword)
                // Passed deadlines are excluded here rather than by a scheduled job,
                // so the rule cannot drift out of step with the data.
                ? internshipRepository.searchOpenAndNotExpired(
                        InternshipStatus.OPEN, keyword.trim(), LocalDate.now(), pageable)
                : internshipRepository.findOpenAndNotExpired(
                        InternshipStatus.OPEN, LocalDate.now(), pageable);
        return PageResponse.from(page, internshipMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public PageResponse<InternshipSummaryResponse> listForAdmin(Pageable pageable) {
        Page<Internship> page = internshipRepository.findAll(pageable);
        return PageResponse.from(page, internshipMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public InternshipDetailResponse getPublicDetail(Long internshipId) {
        Internship internship = requireInternship(internshipId);
        if (!PUBLICLY_VISIBLE.contains(internship.getStatus())) {
            // A draft belongs to the employer only - do not confirm it exists.
            throw NotFoundException.of("Internship", internshipId);
        }
        return internshipMapper.toDetail(internship,
                internshipSkillRepository.findByInternshipId(internshipId));
    }

        /**
     * Removes a vacancy from the employer's list.
     *
     * WHY IT IS ARCHIVED RATHER THAN DELETED WHEN SOMEBODY HAS APPLIED
     *   Every application points at the vacancy, and so does the status
     *   history behind each one. Deleting the row would take the record of
     *   everybody who applied with it - including people who were accepted,
     *   whose placement it documents.
     *
     *   A vacancy nobody has applied to has no such record, so that one is
     *   genuinely deleted. The difference is visible to the employer in what
     *   the confirmation says, so nothing happens that they were not told
     *   about.
     */
    @Transactional
    public boolean removeOwnInternship(Long userId, Long internshipId) {
        Internship internship = requireOwnInternship(userId, internshipId);
        long applications = applicationRepository.countByInternshipId(internshipId);

        if (applications > 0) {
            internship.setStatus(InternshipStatus.ARCHIVED);
            internshipRepository.save(internship);
            log.info("Vacancy {} archived; {} application(s) keep pointing at it",
                    internshipId, applications);
            return false;
        }

        internshipRepository.delete(internship);
        log.info("Vacancy {} deleted; nobody had applied", internshipId);
        return true;
    }

    /** Admin detail view - unlike getPublicDetail, this can open a DRAFT too. */
    @Transactional(readOnly = true)
    public InternshipDetailResponse getAdminDetail(Long internshipId) {
        Internship internship = requireInternship(internshipId);
        return internshipMapper.toDetail(internship,
                internshipSkillRepository.findByInternshipId(internshipId));
    }

    // --------------------------------------------------------------- employer

    @Transactional(readOnly = true)
    public PageResponse<InternshipSummaryResponse> listOwn(Long userId, Pageable pageable) {
        EmployerProfile profile = employerService.requireProfile(userId);
        return PageResponse.from(
                internshipRepository.findByCompanyId(profile.getCompany().getId(), pageable),
                internshipMapper::toSummary);
    }

    @Transactional(readOnly = true)
    public InternshipDetailResponse getOwnDetail(Long userId, Long internshipId) {
        Internship internship = requireOwnInternship(userId, internshipId);
        return internshipMapper.toDetail(internship,
                internshipSkillRepository.findByInternshipId(internship.getId()));
    }

    @Transactional
    public InternshipDetailResponse create(Long userId, InternshipRequest request) {
        EmployerProfile profile = employerService.requireProfile(userId);
        InternshipStatus status = parseStatus(request.getStatus(), InternshipStatus.DRAFT);

        // Publishing needs an approved company; saving a draft does not.
        Company company = (status == InternshipStatus.OPEN)
                ? employerService.requireApprovedCompany(userId)
                : profile.getCompany();

        Internship internship = new Internship();
        internship.setCompany(company);
        internship.setCreatedBy(userId);
        apply(internship, request, status);

        Internship saved = internshipRepository.save(internship);
        // After the save, because a skill row needs the internship's id.
        replaceSkills(saved, request.getRequiredSkills());

        return internshipMapper.toDetail(saved,
                internshipSkillRepository.findByInternshipId(saved.getId()));
    }

    @Transactional
    public InternshipDetailResponse update(Long userId, Long internshipId, InternshipRequest request) {
        Internship internship = requireOwnInternship(userId, internshipId);
        InternshipStatus status = parseStatus(request.getStatus(), internship.getStatus());

        if (status == InternshipStatus.OPEN && internship.getStatus() != InternshipStatus.OPEN) {
            employerService.requireApprovedCompany(userId);
        }
        apply(internship, request, status);

        Internship saved = internshipRepository.save(internship);
        replaceSkills(saved, request.getRequiredSkills());

        return internshipMapper.toDetail(saved,
                internshipSkillRepository.findByInternshipId(saved.getId()));
    }

    // ---------------------------------------------------------------- helpers

    /** Loads an internship and proves it belongs to the caller's company. */
    @Transactional(readOnly = true)
    public Internship requireOwnInternship(Long userId, Long internshipId) {
        EmployerProfile profile = employerService.requireProfile(userId);
        return internshipRepository.findByIdAndCompanyId(internshipId, profile.getCompany().getId())
                .orElseThrow(() -> NotFoundException.of("Internship", internshipId));
    }

    @Transactional(readOnly = true)
    public Internship requireInternship(Long internshipId) {
        return internshipRepository.findById(internshipId)
                .orElseThrow(() -> NotFoundException.of("Internship", internshipId));
    }

    private void apply(Internship internship, InternshipRequest request, InternshipStatus status) {
        internship.setTitle(request.getTitle().trim());
        internship.setDescription(request.getDescription());
        internship.setResponsibilities(request.getResponsibilities());
        internship.setRequirements(request.getRequirements());
        internship.setLocation(request.getLocation());
        internship.setWorkMode(StringUtils.hasText(request.getWorkMode())
                ? WorkMode.valueOf(request.getWorkMode()) : WorkMode.ONSITE);
        internship.setDurationMonths(request.getDurationMonths());
        internship.setStipendAmount(request.getStipendAmount());
        internship.setStipendCurrency(request.getStipendCurrency());
        internship.setAvailablePositions(request.getAvailablePositions() == null
                ? 1 : request.getAvailablePositions());
        internship.setApplicationDeadline(request.getApplicationDeadline());

        if (status == InternshipStatus.OPEN && internship.getPublishedAt() == null) {
            internship.setPublishedAt(LocalDateTime.now());
        }
        internship.setStatus(status);
    }

    /**
     * Rewrites an internship's required skills to exactly what was sent.
     *
     * REPLACE RATHER THAN MERGE
     *   The form edits the whole list at once, so "what was sent" is the
     *   complete answer. Merging would make removing a skill impossible
     *   through the only interface that sets them.
     *
     * NULL MEANS "NOT SENT", EMPTY MEANS "NONE"
     *   A caller that does not know about this field - an older client, or a
     *   partial update written later - must not silently wipe the list. An
     *   empty list is a deliberate statement and does clear it.
     *
     * WHY IT DEDUPLICATES AND TRIMS
     *   uk_internship_skill is UNIQUE (internship_id, name), so two entries
     *   differing only by a trailing space would be two rows, while the same
     *   name twice would fail the insert outright. Comparing case-insensitively
     *   while storing what was typed keeps "React" and "react" from both
     *   counting towards a score the student is meant to be able to argue with.
     */
    private void replaceSkills(Internship internship, List<String> requested) {
        if (requested == null) {
            return;
        }

        internshipSkillRepository.deleteByInternshipId(internship.getId());
        // The delete has to reach the database before the inserts, or the
        // unique constraint sees the old rows and rejects the new ones.
        internshipSkillRepository.flush();

        Set<String> seen = new LinkedHashSet<>();
        for (String raw : requested) {
            if (!StringUtils.hasText(raw)) {
                continue;
            }
            String name = raw.trim();
            if (!seen.add(name.toLowerCase(Locale.ROOT))) {
                continue;
            }
            InternshipSkill skill = new InternshipSkill();
            skill.setInternship(internship);
            skill.setName(name);
            // Every skill on the form is a requirement. The column carries a
            // "nice to have" flag the interface has never offered, so setting
            // it true here says plainly that nothing produces the other value
            // yet, rather than leaving the default to decide.
            skill.setRequired(true);
            internshipSkillRepository.save(skill);
        }
    }

    private InternshipStatus parseStatus(String value, InternshipStatus fallback) {
        return StringUtils.hasText(value) ? InternshipStatus.valueOf(value) : fallback;
    }
}



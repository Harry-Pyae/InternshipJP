package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.SkillDemandItem;
import com.internshipjp.backend.dto.response.SkillGapResponse;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * The student assistant's real subject: what to learn, and what is missing
 * before an employer would take the profile seriously.
 *
 * WHAT IT ANSWERS, AND HOW
 *   "What should I learn next?"  - skills required by open internships that
 *                                  this student does not have, ranked by how
 *                                  many vacancies ask for them
 *   "What am I already good at?" - their skills that are in demand
 *   "Why am I not getting anywhere?" - profile gaps an employer would notice,
 *                                  plus how many applications they have sent
 *
 * Every number is counted from the database. The language model's job is to
 * turn this into advice and a plan, not to guess what is in demand.
 *
 * Owner: Member 1.
 */
@Service
public class StudentSkillGapService {

    private static final int MAX_SKILLS_TO_LEARN = 8;
    private static final int MAX_STRENGTHS = 8;

    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final CertificateRepository certificateRepository;
    private final ApplicationRepository applicationRepository;
    private final SkillMarketService skillMarketService;

    public StudentSkillGapService(StudentProfileRepository studentProfileRepository,
                                  StudentSkillRepository studentSkillRepository,
                                  CertificateRepository certificateRepository,
                                  ApplicationRepository applicationRepository,
                                  SkillMarketService skillMarketService) {
        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.certificateRepository = certificateRepository;
        this.applicationRepository = applicationRepository;
        this.skillMarketService = skillMarketService;
    }

    @Transactional(readOnly = true)
    public SkillGapResponse analyse(Long userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(
                        "No student profile is attached to this account."));

        List<StudentSkill> ownSkills = studentSkillRepository
                .findByStudentProfileIdOrderByNameAsc(profile.getId());
        Set<String> ownSkillKeys = ownSkills.stream()
                .map(skill -> SkillMarketService.normalise(skill.getName()))
                .collect(Collectors.toSet());

        SkillMarketService.SkillMarket market = skillMarketService.snapshot();

        // --- what to learn: in demand, and they do not have it ---------------
        List<SkillDemandItem> toLearn = new ArrayList<>();
        for (Map.Entry<String, Integer> entry : market.allDemand().entrySet()) {
            if (ownSkillKeys.contains(entry.getKey())) {
                continue;
            }
            toLearn.add(new SkillDemandItem(
                    market.displayName(entry.getKey()),
                    entry.getValue(),
                    market.demandSharePercent(entry.getKey()),
                    market.supplyOf(entry.getKey())));
        }
        toLearn.sort(Comparator.comparingInt(SkillDemandItem::getOpenInternshipsRequiring).reversed()
                .thenComparing(SkillDemandItem::getSkill));
        if (toLearn.size() > MAX_SKILLS_TO_LEARN) {
            toLearn = new ArrayList<>(toLearn.subList(0, MAX_SKILLS_TO_LEARN));
        }

        // --- strengths: they have it, and employers ask for it ---------------
        List<SkillDemandItem> strengths = new ArrayList<>();
        List<String> notInDemand = new ArrayList<>();
        for (StudentSkill skill : ownSkills) {
            String key = SkillMarketService.normalise(skill.getName());
            int demand = market.demandFor(key);
            if (demand > 0) {
                strengths.add(new SkillDemandItem(skill.getName(), demand,
                        market.demandSharePercent(key), market.supplyOf(key)));
            } else {
                notInDemand.add(skill.getName());
            }
        }
        strengths.sort(Comparator.comparingInt(SkillDemandItem::getOpenInternshipsRequiring).reversed());
        if (strengths.size() > MAX_STRENGTHS) {
            strengths = new ArrayList<>(strengths.subList(0, MAX_STRENGTHS));
        }

        int verifiedCertificates = certificateRepository
                .findByStudentProfileIdAndVerificationStatus(profile.getId(), VerificationStatus.VERIFIED)
                .size();
        long applications = applicationRepository
                .findByStudentProfileIdOrderByCreatedAtDesc(profile.getId(),
                        org.springframework.data.domain.PageRequest.of(0, 1))
                .getTotalElements();

        List<String> profileGaps = findProfileGaps(profile, ownSkills.size(), verifiedCertificates);

        SkillGapResponse response = new SkillGapResponse();
        response.setProfileCompleteness(completeness(profileGaps));
        response.setProfileGaps(profileGaps);
        response.setSkillsToLearn(toLearn);
        response.setStrengths(strengths);
        response.setSkillsNotInDemand(notInDemand);
        response.setOpenInternshipCount(market.getOpenInternshipsWithSkills());
        response.setVerifiedCertificateCount(verifiedCertificates);
        response.setApplicationCount((int) applications);
        response.setSummary(buildSummary(response, ownSkills.size()));
        return response;
    }

    /** The context block the language model receives for the student chat. */
    @Transactional(readOnly = true)
    public String buildGapContext(SkillGapResponse gaps) {
        StringBuilder context = new StringBuilder();
        context.append("\nSKILL GAP ANALYSIS (calculated from the platform, not estimated)\n");
        context.append("Open internships that list requirements: ")
                .append(gaps.getOpenInternshipCount()).append("\n");
        context.append("Profile completeness: ").append(gaps.getProfileCompleteness()).append("%\n");

        if (!gaps.getProfileGaps().isEmpty()) {
            context.append("Missing from the profile: ")
                    .append(String.join("; ", gaps.getProfileGaps())).append("\n");
        }

        context.append("Most requested skills this student does NOT have:\n");
        if (gaps.getSkillsToLearn().isEmpty()) {
            context.append("  (none - either they have everything requested, or no employer "
                    + "has listed required skills yet)\n");
        } else {
            for (SkillDemandItem item : gaps.getSkillsToLearn()) {
                context.append("  - ").append(item.getSkill())
                        .append(": required by ").append(item.getOpenInternshipsRequiring())
                        .append(" open internship(s) (").append(item.getDemandSharePercent())
                        .append("% of them); ").append(item.getStudentsWithSkill())
                        .append(" student(s) on the platform already have it\n");
            }
        }

        context.append("Skills they have that employers are asking for:\n");
        if (gaps.getStrengths().isEmpty()) {
            context.append("  (none yet)\n");
        } else {
            for (SkillDemandItem item : gaps.getStrengths()) {
                context.append("  - ").append(item.getSkill())
                        .append(": wanted by ").append(item.getOpenInternshipsRequiring())
                        .append(" open internship(s)\n");
            }
        }

        if (!gaps.getSkillsNotInDemand().isEmpty()) {
            context.append("Skills they list that no open internship currently asks for: ")
                    .append(String.join(", ", gaps.getSkillsNotInDemand())).append("\n");
        }

        context.append("Verified certificates: ").append(gaps.getVerifiedCertificateCount())
                .append(". Applications sent so far: ").append(gaps.getApplicationCount()).append(".\n");
        return context.toString();
    }

    // ---------------------------------------------------------------- helpers

    private List<String> findProfileGaps(StudentProfile profile, int skillCount, int verifiedCertificates) {
        List<String> gaps = new ArrayList<>();
        if (skillCount == 0) {
            gaps.add("No skills added yet - employers filter on these first");
        } else if (skillCount < 3) {
            gaps.add("Only " + skillCount + " skill(s) listed - most profiles need more to match well");
        }
        if (!StringUtils.hasText(profile.getFieldOfStudy())) {
            gaps.add("Field of study is empty");
        }
        if (!StringUtils.hasText(profile.getUniversity())) {
            gaps.add("University is empty");
        }
        if (!StringUtils.hasText(profile.getBiography())) {
            gaps.add("No short biography - this is the first thing a recruiter reads");
        }
        if (profile.getGraduationYear() == null) {
            gaps.add("Graduation year is missing - employers use it to check availability");
        }
        if (verifiedCertificates == 0) {
            gaps.add("No verified certificates - unverified ones are never shown to employers");
        }
        if (!StringUtils.hasText(profile.getLocation())) {
            gaps.add("Location is empty - it affects onsite and hybrid matches");
        }
        return gaps;
    }

    /** Seven things are checked, so each one missing costs about 14%. */
    private int completeness(List<String> gaps) {
        int checks = 7;
        int missing = Math.min(gaps.size(), checks);
        return (int) Math.round(((checks - missing) * 100.0) / checks);
    }

    private String buildSummary(SkillGapResponse response, int skillCount) {
        if (response.getOpenInternshipCount() == 0) {
            return "No employer has published an internship with required skills yet, so there is "
                    + "nothing to measure your profile against. Filling in your profile now means "
                    + "you are ready the moment vacancies appear.";
        }
        StringBuilder summary = new StringBuilder();
        summary.append("Your profile is ").append(response.getProfileCompleteness())
                .append("% complete and lists ").append(skillCount).append(" skill(s). ");
        if (!response.getStrengths().isEmpty()) {
            summary.append("Employers are asking for ")
                    .append(response.getStrengths().get(0).getSkill())
                    .append(", which you already have. ");
        }
        if (!response.getSkillsToLearn().isEmpty()) {
            SkillDemandItem top = response.getSkillsToLearn().get(0);
            summary.append("The single most useful thing to learn next is ").append(top.getSkill())
                    .append(", required by ").append(top.getOpenInternshipsRequiring())
                    .append(" of the ").append(response.getOpenInternshipCount())
                    .append(" open internships. ");
        }
        if (response.getVerifiedCertificateCount() == 0) {
            summary.append("You have no verified certificates yet - employers only ever see verified ones.");
        }
        return summary.toString().trim();
    }
}

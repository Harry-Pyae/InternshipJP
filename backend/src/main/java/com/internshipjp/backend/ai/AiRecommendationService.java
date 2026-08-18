package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.InternshipMatchResponse;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import com.internshipjp.backend.util.Dates;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Stage-1 matching: recommends internships without calling any AI provider.
 *
 * WHY THIS EXISTS SEPARATELY FROM THE CHAT
 *   The chat needs an API key, costs money per question, and can be slow. Most
 *   of what a student wants - "which of these openings actually fit me?" - is
 *   answerable with a set intersection. So the platform answers it in Java, and
 *   uses the language model only for the part that genuinely needs language.
 *
 *   Practical consequences:
 *     - recommendations work on day one, before anyone has a Groq key
 *     - the score is reproducible and can be defended in the presentation
 *     - if the provider is down, this feature is unaffected
 *
 * NO INVENTED DATA
 *   A student with no skills listed gets an empty list and a prompt to fill in
 *   their profile - never a plausible-looking list of fake matches.
 *
 * Owner: Member 1.
 */
@Service
public class AiRecommendationService {

    /** How many open internships to score before taking the best ones. */
    private static final int CANDIDATE_POOL_SIZE = 60;

    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipSkillRepository internshipSkillRepository;
    private final ApplicationRepository applicationRepository;
    private final StudentRecommendationService studentRecommendationService;

    public AiRecommendationService(StudentProfileRepository studentProfileRepository,
                                   StudentSkillRepository studentSkillRepository,
                                   InternshipRepository internshipRepository,
                                   InternshipSkillRepository internshipSkillRepository,
                                   ApplicationRepository applicationRepository,
                                   StudentRecommendationService studentRecommendationService) {
        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.internshipRepository = internshipRepository;
        this.internshipSkillRepository = internshipSkillRepository;
        this.applicationRepository = applicationRepository;
        this.studentRecommendationService = studentRecommendationService;
    }

    /**
     * Best-fitting open internships for the signed-in student.
     *
     * Ordering: highest score first, then internships the student has not
     * applied to, then newest. Internships with no listed requirements score 0
     * but are still returned at the end, because "we cannot tell" is different
     * from "bad match".
     */
    @Transactional(readOnly = true)
    public List<InternshipMatchResponse> recommend(Long userId, int limit) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new NotFoundException(
                        "No student profile is attached to this account."));

        List<StudentSkill> skills = studentSkillRepository
                .findByStudentProfileIdOrderByNameAsc(profile.getId());
        Set<String> studentSkillNames = skills.stream()
                .map(skill -> skill.getName().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        List<Internship> openInternships = internshipRepository
                .findByStatus(InternshipStatus.OPEN,
                        PageRequest.of(0, CANDIDATE_POOL_SIZE,
                                Sort.by(Sort.Direction.DESC, "createdAt")))
                .getContent();

        List<InternshipMatchResponse> matches = new ArrayList<>();
        for (Internship internship : openInternships) {
            List<String> required = internshipSkillRepository
                    .findByInternshipId(internship.getId()).stream()
                    .map(InternshipSkill::getName)
                    .toList();

            List<String> matched = required.stream()
                    .filter(name -> studentSkillNames.contains(name.toLowerCase(Locale.ROOT)))
                    .toList();
            List<String> missing = required.stream()
                    .filter(name -> !studentSkillNames.contains(name.toLowerCase(Locale.ROOT)))
                    .toList();

            InternshipMatchResponse match = new InternshipMatchResponse();
            match.setInternshipId(internship.getId());
            match.setTitle(internship.getTitle());
            match.setCompanyName(internship.getCompany().getName());
            match.setLocation(internship.getLocation());
            match.setWorkMode(internship.getWorkMode().name());
            match.setApplicationDeadline(Dates.format(internship.getApplicationDeadline()));
            // Reuse the same scoring the AI context uses, so the number a
            // student sees on this page and the number the assistant talks
            // about can never disagree.
            match.setMatchScore(studentRecommendationService.matchScore(studentSkillNames, required));
            match.setMatchedSkills(matched);
            match.setMissingSkills(missing);
            match.setAlreadyApplied(applicationRepository
                    .existsByInternshipIdAndStudentProfileId(internship.getId(), profile.getId()));
            match.setExplanation(explain(required.size(), matched.size(), missing));
            matches.add(match);
        }

        matches.sort(Comparator
                .comparingInt(InternshipMatchResponse::getMatchScore).reversed()
                .thenComparing(InternshipMatchResponse::isAlreadyApplied)
                .thenComparing(InternshipMatchResponse::getInternshipId,
                        Comparator.reverseOrder()));

        return matches.size() > limit ? matches.subList(0, limit) : matches;
    }

    /** Plain-English reason for the number. No model involved. */
    private String explain(int requiredCount, int matchedCount, List<String> missing) {
        if (requiredCount == 0) {
            return "This employer has not listed required skills, so we cannot score the fit yet. "
                    + "Read the description to judge it yourself.";
        }
        if (matchedCount == 0) {
            return "None of the " + requiredCount + " required skills are on your profile yet. "
                    + "Add any you already have, or treat the list as what to learn next.";
        }
        String base = "You have " + matchedCount + " of the " + requiredCount + " required skills.";
        if (missing.isEmpty()) {
            return base + " You meet every listed requirement.";
        }
        return base + " Still missing: " + String.join(", ", missing) + ".";
    }
}

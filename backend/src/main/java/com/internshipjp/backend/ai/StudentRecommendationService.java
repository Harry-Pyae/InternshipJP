package com.internshipjp.backend.ai;

import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.entity.StudentInterest;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.repository.StudentInterestRepository;
import com.internshipjp.backend.repository.StudentProfileRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Builds the CONTEXT block for the student assistant.
 *
 * TWO-STAGE MATCHING, ON PURPOSE
 *   Stage 1 is ordinary Java: count how many of an internship's required
 *   skills the student actually has. It is deterministic, explainable, and it
 *   works with the AI switched off.
 *   Stage 2 is the language model, which explains the shortlist in words.
 *   The model is given our score - it is not asked to invent one.
 *
 * NO INVENTED DATA
 *   If the student has not filled anything in, this returns empty() and the
 *   caller answers honestly that the profile is not ready yet. It never
 *   fabricates a profile to make a demo look good.
 */
@Service
public class StudentRecommendationService {

    private static final int MAX_INTERNSHIPS_IN_CONTEXT = 8;

    private final StudentProfileRepository studentProfileRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final StudentInterestRepository studentInterestRepository;
    private final CertificateRepository certificateRepository;
    private final InternshipRepository internshipRepository;
    private final InternshipSkillRepository internshipSkillRepository;

    public StudentRecommendationService(StudentProfileRepository studentProfileRepository,
                                        StudentSkillRepository studentSkillRepository,
                                        StudentInterestRepository studentInterestRepository,
                                        CertificateRepository certificateRepository,
                                        InternshipRepository internshipRepository,
                                        InternshipSkillRepository internshipSkillRepository) {
        this.studentProfileRepository = studentProfileRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.studentInterestRepository = studentInterestRepository;
        this.certificateRepository = certificateRepository;
        this.internshipRepository = internshipRepository;
        this.internshipSkillRepository = internshipSkillRepository;
    }

    /**
     * @return the context text, or empty when there is not enough real data
     *         to give a useful answer
     */
    @Transactional(readOnly = true)
    public Optional<String> buildContext(Long userId) {
        StudentProfile profile = studentProfileRepository.findByUserId(userId).orElse(null);
        if (profile == null) {
            return Optional.empty();
        }

        List<StudentSkill> skills = studentSkillRepository
                .findByStudentProfileIdOrderByNameAsc(profile.getId());
        List<StudentInterest> interests = studentInterestRepository
                .findByStudentProfileId(profile.getId());
        // Verified only: an unverified certificate is not evidence.
        List<Certificate> certificates = certificateRepository
                .findByStudentProfileIdAndVerificationStatus(profile.getId(), VerificationStatus.VERIFIED);

        boolean profileIsEmpty = skills.isEmpty() && interests.isEmpty()
                && profile.getUniversity() == null && profile.getFieldOfStudy() == null;
        if (profileIsEmpty) {
            return Optional.empty();
        }

        List<Internship> openInternships = internshipRepository
                .findByStatus(InternshipStatus.OPEN, PageRequest.of(0, MAX_INTERNSHIPS_IN_CONTEXT))
                .getContent();

        Set<String> studentSkillNames = skills.stream()
                .map(skill -> skill.getName().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        StringBuilder context = new StringBuilder();
        context.append("CONTEXT\n=======\n");
        context.append("Student: ").append(profile.getUser().getFullName()).append("\n");
        appendIfPresent(context, "Headline", profile.getHeadline());
        appendIfPresent(context, "University", profile.getUniversity());
        appendIfPresent(context, "Degree", profile.getDegree());
        appendIfPresent(context, "Field of study", profile.getFieldOfStudy());
        appendIfPresent(context, "Location", profile.getLocation());
        appendIfPresent(context, "Availability", profile.getAvailability());
        if (profile.getGraduationYear() != null) {
            context.append(profile.isCurrentlyAttending() ? "Expects to graduate: " : "Graduated: ")
                    .append(profile.getGraduationYear()).append("\n");
        }
        if (profile.getPreferredWorkMode() != null) {
            context.append("Prefers: ").append(profile.getPreferredWorkMode().name()).append("\n");
        }

        context.append("\nSkills: ").append(skills.isEmpty() ? "none listed yet"
                : skills.stream().map(this::describeSkill).collect(Collectors.joining(", "))).append("\n");
        context.append("Career interests: ").append(interests.isEmpty() ? "none listed yet"
                : interests.stream().map(StudentInterest::getInterest)
                .collect(Collectors.joining(", "))).append("\n");
        context.append("Verified certificates: ").append(certificates.isEmpty() ? "none"
                : certificates.stream().map(Certificate::getTitle)
                .collect(Collectors.joining(", "))).append("\n");

        context.append("\nOPEN INTERNSHIPS\n");
        if (openInternships.isEmpty()) {
            context.append("There are no open internships on the platform at the moment.\n");
        } else {
            for (Internship internship : openInternships) {
                List<String> required = internshipSkillRepository
                        .findByInternshipId(internship.getId()).stream()
                        .map(skill -> skill.getName()).toList();
                context.append("- [id ").append(internship.getId()).append("] ")
                        .append(internship.getTitle())
                        .append(" at ").append(internship.getCompany().getName());
                appendInline(context, ", location: ", internship.getLocation());
                context.append(", mode: ").append(internship.getWorkMode().name());
                if (!required.isEmpty()) {
                    context.append(", required skills: ").append(String.join(", ", required));
                    context.append(", match score we calculated: ")
                            .append(matchScore(studentSkillNames, required)).append("%");
                }
                context.append("\n");
            }
        }
        return Optional.of(context.toString());
    }

    /**
     * Stage-1 score: the share of an internship's required skills the student
     * already lists. Plain arithmetic - if a student asks why they got 40%,
     * we can show them exactly which two of five skills matched.
     */
    public int matchScore(Set<String> studentSkillsLowercase, List<String> requiredSkills) {
        if (requiredSkills.isEmpty()) {
            return 0;
        }
        long matched = requiredSkills.stream()
                .map(skill -> skill.toLowerCase(Locale.ROOT))
                .filter(studentSkillsLowercase::contains)
                .count();
        return (int) Math.round((matched * 100.0) / requiredSkills.size());
    }

    private String describeSkill(StudentSkill skill) {
        return skill.getProficiency() == null
                ? skill.getName()
                : skill.getName() + " (" + skill.getProficiency().name().toLowerCase(Locale.ROOT) + ")";
    }

    private void appendIfPresent(StringBuilder builder, String label, String value) {
        if (value != null && !value.isBlank()) {
            builder.append(label).append(": ").append(value).append("\n");
        }
    }

    private void appendInline(StringBuilder builder, String label, String value) {
        if (value != null && !value.isBlank()) {
            builder.append(label).append(value);
        }
    }
}

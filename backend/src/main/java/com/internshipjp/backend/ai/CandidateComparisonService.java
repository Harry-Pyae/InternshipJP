package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.CertificateResponse;
import com.internshipjp.backend.entity.Application;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.StudentProfile;
import com.internshipjp.backend.entity.StudentSkill;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.repository.StudentSkillRepository;
import com.internshipjp.backend.service.CertificateService;
import com.internshipjp.backend.service.InternshipService;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Builds the CONTEXT block for the employer assistant.
 *
 * TWO HARD RULES, BOTH ENFORCED HERE
 *   1. The internship is loaded through InternshipService.requireOwnInternship,
 *      so an employer can only ever discuss vacancies their own company owns.
 *   2. Only VERIFIED certificates are included, via
 *      CertificateService.verifiedCertificatesOf. There is no code path in
 *      this class that could put a pending certificate in front of a recruiter.
 *
 * Nothing about the applicant's account, contact details or password material
 * is included - the model sees skills, education and verified qualifications.
 */
@Service
public class CandidateComparisonService {

    private static final int MAX_CANDIDATES_IN_CONTEXT = 10;

    private final ApplicationRepository applicationRepository;
    private final StudentSkillRepository studentSkillRepository;
    private final InternshipSkillRepository internshipSkillRepository;
    private final InternshipService internshipService;
    private final CertificateService certificateService;

    public CandidateComparisonService(ApplicationRepository applicationRepository,
                                      StudentSkillRepository studentSkillRepository,
                                      InternshipSkillRepository internshipSkillRepository,
                                      InternshipService internshipService,
                                      CertificateService certificateService) {
        this.applicationRepository = applicationRepository;
        this.studentSkillRepository = studentSkillRepository;
        this.internshipSkillRepository = internshipSkillRepository;
        this.internshipService = internshipService;
        this.certificateService = certificateService;
    }

    /**
     * @return the context text, or empty when the internship has no applicants
     *         yet - in which case the caller says so instead of inventing some
     */
    @Transactional(readOnly = true)
    public Optional<String> buildContext(Long employerUserId, Long internshipId) {
        // Ownership check. Throws if this internship belongs to another company.
        Internship internship = internshipService.requireOwnInternship(employerUserId, internshipId);

        List<Application> applications = applicationRepository
                .findByInternshipId(internship.getId(), PageRequest.of(0, MAX_CANDIDATES_IN_CONTEXT))
                .getContent();
        if (applications.isEmpty()) {
            return Optional.empty();
        }

        List<String> requiredSkills = internshipSkillRepository
                .findByInternshipId(internship.getId()).stream()
                .map(skill -> skill.getName()).toList();

        StringBuilder context = new StringBuilder();
        context.append("CONTEXT\n=======\n");
        context.append("Internship: ").append(internship.getTitle())
                .append(" at ").append(internship.getCompany().getName()).append("\n");
        if (internship.getRequirements() != null && !internship.getRequirements().isBlank()) {
            context.append("Requirements: ").append(internship.getRequirements()).append("\n");
        }
        context.append("Required skills: ")
                .append(requiredSkills.isEmpty() ? "not specified" : String.join(", ", requiredSkills))
                .append("\n\nCANDIDATES\n");

        int index = 1;
        for (Application application : applications) {
            StudentProfile student = application.getStudentProfile();
            List<StudentSkill> skills = studentSkillRepository
                    .findByStudentProfileIdOrderByNameAsc(student.getId());
            List<CertificateResponse> verified =
                    certificateService.verifiedCertificatesOf(student.getId());

            context.append(index++).append(". ").append(student.getUser().getFullName())
                    .append(" (application id ").append(application.getId())
                    .append(", status ").append(application.getStatus().name()).append(")\n");
            appendIfPresent(context, "   University", student.getUniversity());
            appendIfPresent(context, "   Field of study", student.getFieldOfStudy());
            context.append("   Skills: ").append(skills.isEmpty() ? "none listed"
                    : skills.stream().map(StudentSkill::getName)
                    .collect(Collectors.joining(", "))).append("\n");
            context.append("   Verified certificates: ").append(verified.isEmpty() ? "none"
                    : verified.stream().map(CertificateResponse::getTitle)
                    .collect(Collectors.joining(", "))).append("\n");
        }

        context.append("\nOnly verified certificates are listed above. "
                + "Treat anything not listed as unknown, not as absent.\n");
        return Optional.of(context.toString());
    }

    private void appendIfPresent(StringBuilder builder, String label, String value) {
        if (value != null && !value.isBlank()) {
            builder.append(label).append(": ").append(value).append("\n");
        }
    }
}

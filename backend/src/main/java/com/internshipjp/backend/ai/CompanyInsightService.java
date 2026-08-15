package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.CompanyInsightResponse;
import com.internshipjp.backend.dto.response.SkillDemandItem;
import com.internshipjp.backend.entity.ApplicationStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.Internship;
import com.internshipjp.backend.entity.InternshipSkill;
import com.internshipjp.backend.entity.InternshipStatus;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.InternshipRepository;
import com.internshipjp.backend.repository.InternshipSkillRepository;
import com.internshipjp.backend.service.EmployerService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * The employer assistant's second subject: not "who should I hire?" but
 * "why is this not working, and what are we missing?"
 *
 * WHAT IT LOOKS AT
 *   - the company's own listings: what is vague, empty, expired or unpublished
 *   - the pipeline: how many applicants are sitting unreviewed
 *   - supply and demand: skills this company requires that almost no student
 *     on the platform actually has
 *
 * That last one is the insight an employer cannot get anywhere else. If a
 * vacancy asks for a skill three students out of forty possess, the vacancy is
 * the problem, not the candidate pool - and no amount of waiting fixes it.
 *
 * PRIVACY
 *   This report is about the company, not about people. It counts applications
 *   but never names an applicant, and it never touches certificates.
 *
 * Owner: Member 1.
 */
@Service
public class CompanyInsightService {

    /** At or below this many students holding a skill, it is hard to fill. */
    private static final int SCARCE_SUPPLY_THRESHOLD = 2;
    private static final int MAX_LISTING_ISSUES = 10;

    private final EmployerService employerService;
    private final InternshipRepository internshipRepository;
    private final InternshipSkillRepository internshipSkillRepository;
    private final ApplicationRepository applicationRepository;
    private final SkillMarketService skillMarketService;

    public CompanyInsightService(EmployerService employerService,
                                 InternshipRepository internshipRepository,
                                 InternshipSkillRepository internshipSkillRepository,
                                 ApplicationRepository applicationRepository,
                                 SkillMarketService skillMarketService) {
        this.employerService = employerService;
        this.internshipRepository = internshipRepository;
        this.internshipSkillRepository = internshipSkillRepository;
        this.applicationRepository = applicationRepository;
        this.skillMarketService = skillMarketService;
    }

    @Transactional(readOnly = true)
    public CompanyInsightResponse analyse(Long employerUserId) {
        Company company = employerService.requireProfile(employerUserId).getCompany();
        Long companyId = company.getId();

        List<Internship> internships = internshipRepository.findByCompanyId(companyId);
        SkillMarketService.SkillMarket market = skillMarketService.snapshot();

        CompanyInsightResponse response = new CompanyInsightResponse();
        response.setCompanyName(company.getName());
        response.setApprovalStatus(company.getApprovalStatus().name());
        response.setTotalInternships(internships.size());
        response.setOpenInternships((int) internships.stream()
                .filter(i -> i.getStatus() == InternshipStatus.OPEN).count());
        response.setDraftInternships((int) internships.stream()
                .filter(i -> i.getStatus() == InternshipStatus.DRAFT).count());

        response.setTotalApplications(applicationRepository.countByInternship_Company_Id(companyId));
        response.setAwaitingReview(applicationRepository
                .countByInternship_Company_IdAndStatus(companyId, ApplicationStatus.APPLIED));
        response.setShortlisted(applicationRepository
                .countByInternship_Company_IdAndStatus(companyId, ApplicationStatus.SHORTLISTED));
        response.setAccepted(applicationRepository
                .countByInternship_Company_IdAndStatus(companyId, ApplicationStatus.ACCEPTED));
        response.setRejected(applicationRepository
                .countByInternship_Company_IdAndStatus(companyId, ApplicationStatus.REJECTED));

        response.setListingIssues(findListingIssues(internships));
        response.setHardToFillSkills(findHardToFillSkills(companyId, market));
        response.setRecommendations(buildRecommendations(company, response));
        response.setSummary(buildSummary(response));
        return response;
    }

    /** The context block the language model receives for the company review. */
    public String buildInsightContext(CompanyInsightResponse insight) {
        StringBuilder context = new StringBuilder();
        context.append("CONTEXT\n=======\n");
        context.append("Company: ").append(insight.getCompanyName())
                .append(" (approval status: ").append(insight.getApprovalStatus()).append(")\n");
        context.append("Internships: ").append(insight.getTotalInternships())
                .append(" total, ").append(insight.getOpenInternships()).append(" open, ")
                .append(insight.getDraftInternships()).append(" still draft\n");
        context.append("Applications received: ").append(insight.getTotalApplications())
                .append(" (").append(insight.getAwaitingReview()).append(" not yet reviewed, ")
                .append(insight.getShortlisted()).append(" shortlisted, ")
                .append(insight.getAccepted()).append(" accepted, ")
                .append(insight.getRejected()).append(" rejected)\n");

        context.append("\nLISTING PROBLEMS\n");
        if (insight.getListingIssues().isEmpty()) {
            context.append("None found - every listing has a description, requirements, "
                    + "skills and a sensible deadline.\n");
        } else {
            for (CompanyInsightResponse.ListingIssue issue : insight.getListingIssues()) {
                context.append("- \"").append(issue.getTitle()).append("\" (")
                        .append(issue.getStatus()).append(", ")
                        .append(issue.getApplicationCount()).append(" applicant(s)): ")
                        .append(String.join("; ", issue.getIssues())).append("\n");
            }
        }

        context.append("\nSKILLS THIS COMPANY ASKS FOR THAT ARE SCARCE ON THE PLATFORM\n");
        if (insight.getHardToFillSkills().isEmpty()) {
            context.append("None - the required skills are reasonably common among students.\n");
        } else {
            for (SkillDemandItem item : insight.getHardToFillSkills()) {
                context.append("- ").append(item.getSkill()).append(": only ")
                        .append(item.getStudentsWithSkill())
                        .append(" student(s) on the whole platform list this skill\n");
            }
        }

        context.append("\nCALCULATED SUGGESTIONS\n");
        for (String recommendation : insight.getRecommendations()) {
            context.append("- ").append(recommendation).append("\n");
        }
        return context.toString();
    }

    // ---------------------------------------------------------------- helpers

    private List<CompanyInsightResponse.ListingIssue> findListingIssues(List<Internship> internships) {
        List<CompanyInsightResponse.ListingIssue> found = new ArrayList<>();

        for (Internship internship : internships) {
            if (internship.getStatus() == InternshipStatus.ARCHIVED) {
                continue;
            }
            List<String> issues = new ArrayList<>();
            long applicants = applicationRepository.countByInternshipId(internship.getId());

            if (!StringUtils.hasText(internship.getDescription())) {
                issues.add("no description");
            }
            if (!StringUtils.hasText(internship.getRequirements())) {
                issues.add("no requirements written");
            }
            if (!StringUtils.hasText(internship.getResponsibilities())) {
                issues.add("no responsibilities written");
            }
            if (internshipSkillRepository.findByInternshipId(internship.getId()).isEmpty()) {
                issues.add("no required skills listed, so students cannot be matched to it");
            }
            if (internship.getStipendAmount() == null) {
                issues.add("no stipend information, which reduces applications");
            }
            if (internship.getApplicationDeadline() == null) {
                issues.add("no application deadline");
            } else if (internship.getStatus() == InternshipStatus.OPEN
                    && internship.getApplicationDeadline().isBefore(LocalDate.now())) {
                issues.add("deadline has passed but the vacancy is still OPEN");
            }
            if (internship.getStatus() == InternshipStatus.DRAFT) {
                issues.add("still a draft, so no student can see it");
            }
            if (internship.getStatus() == InternshipStatus.OPEN && applicants == 0) {
                issues.add("open but has received no applications");
            }

            if (!issues.isEmpty()) {
                found.add(new CompanyInsightResponse.ListingIssue(
                        internship.getId(), internship.getTitle(),
                        internship.getStatus().name(), applicants, issues));
            }
        }

        // Worst first, so the employer fixes the most broken listing first.
        found.sort(Comparator.comparingInt(
                (CompanyInsightResponse.ListingIssue issue) -> issue.getIssues().size()).reversed());
        return found.size() > MAX_LISTING_ISSUES
                ? new ArrayList<>(found.subList(0, MAX_LISTING_ISSUES))
                : found;
    }

    private List<SkillDemandItem> findHardToFillSkills(Long companyId,
                                                        SkillMarketService.SkillMarket market) {
        List<InternshipSkill> required = internshipSkillRepository.findAllByCompanyId(companyId);
        Set<String> seen = new HashSet<>();
        List<SkillDemandItem> scarce = new ArrayList<>();

        for (InternshipSkill skill : required) {
            String key = SkillMarketService.normalise(skill.getName());
            if (!seen.add(key)) {
                continue;
            }
            int supply = market.supplyOf(key);
            if (supply <= SCARCE_SUPPLY_THRESHOLD) {
                scarce.add(new SkillDemandItem(skill.getName(), market.demandFor(key),
                        market.demandSharePercent(key), supply));
            }
        }
        scarce.sort(Comparator.comparingInt(SkillDemandItem::getStudentsWithSkill));
        return scarce;
    }

    private List<String> buildRecommendations(Company company, CompanyInsightResponse insight) {
        List<String> recommendations = new ArrayList<>();

        if (company.getApprovalStatus() != ApprovalStatus.APPROVED) {
            recommendations.add("Your company is " + company.getApprovalStatus().name()
                    + ", so nothing you publish is visible to students. This is the first thing to fix.");
        }
        if (insight.getTotalInternships() == 0) {
            recommendations.add("You have not created any internships yet.");
            return recommendations;
        }
        if (insight.getOpenInternships() == 0 && insight.getDraftInternships() > 0) {
            recommendations.add("All " + insight.getDraftInternships()
                    + " of your internships are still drafts. Students only ever see OPEN ones.");
        }
        if (insight.getAwaitingReview() > 0) {
            recommendations.add(insight.getAwaitingReview()
                    + " applicant(s) are still in APPLIED and have never been reviewed. "
                    + "Slow responses are the most common reason good candidates go elsewhere.");
        }
        if (!insight.getHardToFillSkills().isEmpty()) {
            SkillDemandItem scarcest = insight.getHardToFillSkills().get(0);
            recommendations.add("Very few students list " + scarcest.getSkill()
                    + " (" + scarcest.getStudentsWithSkill() + " on the whole platform). "
                    + "Consider marking it as nice-to-have rather than required, or accepting a "
                    + "related skill, otherwise this vacancy will keep attracting nobody.");
        }
        if (!StringUtils.hasText(company.getDescription())) {
            recommendations.add("Your company profile has no description. Students see it before "
                    + "they decide whether to apply.");
        }
        if (!StringUtils.hasText(company.getWebsite())) {
            recommendations.add("Your company profile has no website, which makes the listing look "
                    + "less credible.");
        }
        long unreviewedShare = insight.getTotalApplications() == 0 ? 0
                : (insight.getAwaitingReview() * 100) / insight.getTotalApplications();
        if (insight.getTotalApplications() > 0 && unreviewedShare > 50) {
            recommendations.add(unreviewedShare + "% of all applications you have ever received are "
                    + "still unreviewed.");
        }
        if (recommendations.isEmpty()) {
            recommendations.add("No structural problems found. Your listings are complete and your "
                    + "pipeline is being kept up to date.");
        }
        return recommendations;
    }

    private String buildSummary(CompanyInsightResponse insight) {
        if (insight.getTotalInternships() == 0) {
            return "You have not published any internships yet, so there is nothing to analyse. "
                    + "Create one with a clear description and a list of required skills - the "
                    + "required skills are what students get matched against.";
        }
        StringBuilder summary = new StringBuilder();
        summary.append(insight.getCompanyName()).append(" has ")
                .append(insight.getOpenInternships()).append(" open internship(s) and has received ")
                .append(insight.getTotalApplications()).append(" application(s). ");
        if (insight.getAwaitingReview() > 0) {
            summary.append(insight.getAwaitingReview()).append(" are still waiting for a first review. ");
        }
        if (!insight.getListingIssues().isEmpty()) {
            summary.append(insight.getListingIssues().size())
                    .append(" listing(s) have something missing that is likely costing you applicants. ");
        }
        if (!insight.getHardToFillSkills().isEmpty()) {
            summary.append(insight.getHardToFillSkills().size())
                    .append(" of the skills you require are held by almost no students on the platform.");
        }
        return summary.toString().trim();
    }
}

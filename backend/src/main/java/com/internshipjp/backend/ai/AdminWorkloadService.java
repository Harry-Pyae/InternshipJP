package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.AdminWorkloadResponse;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.Application;
import com.internshipjp.backend.entity.ApplicationStatus;
import com.internshipjp.backend.entity.ApprovalStatus;
import com.internshipjp.backend.entity.Certificate;
import com.internshipjp.backend.entity.Company;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.VerificationStatus;
import com.internshipjp.backend.repository.ApplicationRepository;
import com.internshipjp.backend.repository.CertificateRepository;
import com.internshipjp.backend.repository.CompanyRepository;
import com.internshipjp.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * "What should I work on today?" - the administrator's calculated report.
 *
 * WHY AGE IS THE WHOLE POINT
 *   A queue length tells an admin almost nothing. Five pending certificates
 *   could be five minutes old. What matters is that one of them has been
 *   waiting eleven days, because for eleven days a student has been unable to
 *   show that qualification to any employer - our delay, their opportunity.
 *
 *   So every item carries how long it has waited, the lists are ordered oldest
 *   first, and the urgency thresholds are stated once here rather than being
 *   invented differently on each screen.
 *
 * WHAT AN ADMIN CAN AND CANNOT ACT ON
 *   Certificates and company approvals are theirs to decide. Stalled
 *   applications are not - only the employer can move those. They are included
 *   because an applicant ignored for three weeks is a platform problem worth
 *   noticing, and the right action is a nudge, not a decision.
 *
 * Owner: Member 1 (AI). The admin screens that render it are Member 4's.
 */
@Service
public class AdminWorkloadService {

    /** Days waiting before an item stops being routine. */
    private static final int WARN_AFTER_DAYS = 3;
    private static final int URGENT_AFTER_DAYS = 7;
    /** An application nobody has opened after this long is stalled. */
    private static final int STALLED_APPLICATION_DAYS = 7;
    private static final int MAX_ITEMS = 8;

    private final CertificateRepository certificateRepository;
    private final CompanyRepository companyRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    public AdminWorkloadService(CertificateRepository certificateRepository,
                                CompanyRepository companyRepository,
                                ApplicationRepository applicationRepository,
                                UserRepository userRepository) {
        this.certificateRepository = certificateRepository;
        this.companyRepository = companyRepository;
        this.applicationRepository = applicationRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AdminWorkloadResponse analyse() {
        LocalDateTime now = LocalDateTime.now();
        AdminWorkloadResponse response = new AdminWorkloadResponse();
        response.setGeneratedAt(now.toString());

        // --- the two queues an administrator actually decides ---------------
        List<Certificate> pendingCertificates = certificateRepository
                .findByVerificationStatusOrderByCreatedAtAsc(
                        VerificationStatus.PENDING, PageRequest.of(0, MAX_ITEMS))
                .getContent();
        List<Company> pendingCompanies = companyRepository
                .findByApprovalStatusOrderByCreatedAtAsc(
                        ApprovalStatus.PENDING, PageRequest.of(0, MAX_ITEMS))
                .getContent();

        response.setCertificatesPending(
                certificateRepository.countByVerificationStatus(VerificationStatus.PENDING));
        response.setCompaniesPending(
                companyRepository.countByApprovalStatus(ApprovalStatus.PENDING));

        List<AdminWorkloadResponse.WorkItem> certificateItems = new ArrayList<>();
        for (Certificate certificate : pendingCertificates) {
            int days = daysSince(certificate.getCreatedAt(), now);
            certificateItems.add(new AdminWorkloadResponse.WorkItem(
                    certificate.getId(),
                    certificate.getTitle(),
                    certificate.getStudentProfile().getUser().getFullName()
                            + (certificate.getIssuingOrganization() == null
                                    ? "" : " - " + certificate.getIssuingOrganization()),
                    days, urgency(days)));
        }
        response.setOldestCertificates(certificateItems);

        List<AdminWorkloadResponse.WorkItem> companyItems = new ArrayList<>();
        for (Company company : pendingCompanies) {
            int days = daysSince(company.getCreatedAt(), now);
            companyItems.add(new AdminWorkloadResponse.WorkItem(
                    company.getId(),
                    company.getName(),
                    company.getRegistrationNumber() == null
                            ? "No registration number given"
                            : "Registration " + company.getRegistrationNumber(),
                    days, urgency(days)));
        }
        response.setOldestCompanies(companyItems);

        // --- applications nobody has opened ---------------------------------
        List<Application> untouched = applicationRepository
                .findByStatusOrderByCreatedAtAsc(ApplicationStatus.APPLIED,
                        PageRequest.of(0, MAX_ITEMS * 3))
                .getContent();
        List<AdminWorkloadResponse.WorkItem> stalled = new ArrayList<>();
        for (Application application : untouched) {
            int days = daysSince(application.getCreatedAt(), now);
            if (days < STALLED_APPLICATION_DAYS) {
                // The list is oldest first, so everything after this is newer.
                break;
            }
            stalled.add(new AdminWorkloadResponse.WorkItem(
                    application.getId(),
                    application.getInternship().getTitle(),
                    application.getInternship().getCompany().getName()
                            + " has not opened this application",
                    days, urgency(days)));
            if (stalled.size() >= MAX_ITEMS) {
                break;
            }
        }
        response.setStalledApplications(stalled);
        response.setApplicationsStalled(stalled.size());

        response.setTotalStudents(userRepository.countByRole(Role.STUDENT));
        response.setTotalEmployers(userRepository.countByRole(Role.EMPLOYER));
        response.setSuspendedAccounts(userRepository.countByAccountStatus(AccountStatus.SUSPENDED));

        response.setPriorities(buildPriorities(response));
        response.setSummary(buildSummary(response));
        return response;
    }

    /** The context block the language model receives for the admin chat. */
    public String buildWorkloadContext(AdminWorkloadResponse workload) {
        StringBuilder context = new StringBuilder();
        context.append("CONTEXT\n=======\n");
        context.append("Platform: ").append(workload.getTotalStudents()).append(" student(s), ")
                .append(workload.getTotalEmployers()).append(" employer(s), ")
                .append(workload.getSuspendedAccounts()).append(" suspended account(s)\n\n");

        context.append("CERTIFICATES WAITING FOR VERIFICATION: ")
                .append(workload.getCertificatesPending()).append("\n");
        appendItems(context, workload.getOldestCertificates(),
                "None waiting - the queue is clear.");

        context.append("\nCOMPANIES WAITING FOR APPROVAL: ")
                .append(workload.getCompaniesPending()).append("\n");
        appendItems(context, workload.getOldestCompanies(),
                "None waiting - the queue is clear.");

        context.append("\nAPPLICATIONS NO EMPLOYER HAS OPENED (over ")
                .append(STALLED_APPLICATION_DAYS).append(" days): ")
                .append(workload.getApplicationsStalled()).append("\n");
        appendItems(context, workload.getStalledApplications(),
                "None - employers are responding.");

        context.append("\nCALCULATED PRIORITIES\n");
        for (String priority : workload.getPriorities()) {
            context.append("- ").append(priority).append("\n");
        }
        context.append("\nThresholds used: an item is routine under ").append(WARN_AFTER_DAYS)
                .append(" days, needs attention after ").append(WARN_AFTER_DAYS)
                .append(", and is overdue after ").append(URGENT_AFTER_DAYS).append(".\n");
        return context.toString();
    }

    // ---------------------------------------------------------------- helpers

    private void appendItems(StringBuilder context,
                             List<AdminWorkloadResponse.WorkItem> items, String emptyText) {
        if (items.isEmpty()) {
            context.append("  ").append(emptyText).append("\n");
            return;
        }
        for (AdminWorkloadResponse.WorkItem item : items) {
            context.append("  - \"").append(item.getLabel()).append("\" (")
                    .append(item.getDetail()).append(") - waiting ")
                    .append(item.getDaysWaiting()).append(" day(s)\n");
        }
    }

    private int daysSince(LocalDateTime moment, LocalDateTime now) {
        if (moment == null) {
            return 0;
        }
        return (int) Duration.between(moment, now).toDays();
    }

    private String urgency(int days) {
        if (days >= URGENT_AFTER_DAYS) {
            return "bad";
        }
        if (days >= WARN_AFTER_DAYS) {
            return "warn";
        }
        return "ok";
    }

    private List<String> buildPriorities(AdminWorkloadResponse workload) {
        List<String> priorities = new ArrayList<>();

        int oldestCertificate = oldestAge(workload.getOldestCertificates());
        int oldestCompany = oldestAge(workload.getOldestCompanies());

        if (oldestCertificate >= URGENT_AFTER_DAYS) {
            priorities.add("A certificate has been waiting " + oldestCertificate
                    + " days. Until it is reviewed, that student cannot show the qualification "
                    + "to any employer. Start here.");
        } else if (workload.getCertificatesPending() > 0) {
            priorities.add("Review the " + workload.getCertificatesPending()
                    + " pending certificate(s). Verifying one is what makes it visible to "
                    + "employers - nothing else in the system can.");
        }

        if (oldestCompany >= URGENT_AFTER_DAYS) {
            priorities.add("A company has been waiting " + oldestCompany
                    + " days for approval. Its recruiters cannot publish anything until then, "
                    + "so no student is seeing their vacancies.");
        } else if (workload.getCompaniesPending() > 0) {
            priorities.add("Approve or reject the " + workload.getCompaniesPending()
                    + " pending company registration(s).");
        }

        if (workload.getApplicationsStalled() > 0) {
            priorities.add(workload.getApplicationsStalled()
                    + " application(s) have sat unopened for over " + STALLED_APPLICATION_DAYS
                    + " days. You cannot decide these, but the employers can be reminded.");
        }

        if (priorities.isEmpty()) {
            priorities.add("Nothing is waiting. Both queues are clear and employers are "
                    + "responding to applicants.");
        }
        return priorities;
    }

    private int oldestAge(List<AdminWorkloadResponse.WorkItem> items) {
        return items.isEmpty() ? 0 : items.get(0).getDaysWaiting();
    }

    private String buildSummary(AdminWorkloadResponse workload) {
        long waiting = workload.getCertificatesPending() + workload.getCompaniesPending();
        if (waiting == 0 && workload.getApplicationsStalled() == 0) {
            return "Nothing needs your decision today. Both review queues are empty and no "
                    + "applicant has been left waiting.";
        }
        StringBuilder summary = new StringBuilder();
        summary.append(waiting).append(" item(s) are waiting for you: ")
                .append(workload.getCertificatesPending()).append(" certificate(s) and ")
                .append(workload.getCompaniesPending()).append(" company registration(s). ");
        int oldest = Math.max(oldestAge(workload.getOldestCertificates()),
                oldestAge(workload.getOldestCompanies()));
        if (oldest >= URGENT_AFTER_DAYS) {
            summary.append("The oldest has been waiting ").append(oldest)
                    .append(" days, which is past the point where it is holding someone up. ");
        }
        if (workload.getApplicationsStalled() > 0) {
            summary.append(workload.getApplicationsStalled())
                    .append(" applicant(s) are still waiting on an employer to open their application.");
        }
        return summary.toString().trim();
    }
}

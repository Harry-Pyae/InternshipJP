package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.ApplicationStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;

/**
 * Applications.
 *
 * findByIdAndInternship_Company_Id is the ownership guard employers must use:
 * it makes it impossible to load an application belonging to another company.
 */
@Repository
public interface ApplicationRepository extends JpaRepository<Application, Long> {

    boolean existsByInternshipIdAndStudentProfileId(Long internshipId, Long studentProfileId);
    Page<Application> findByStudentProfileIdOrderByCreatedAtDesc(Long studentProfileId, Pageable pageable);
    Page<Application> findByInternshipId(Long internshipId, Pageable pageable);

    /**
     * Every application across one company's vacancies.
     *
     * Scoped by company rather than by employer, because two recruiters at
     * the same company should see the same applicants - the vacancy belongs
     * to the organisation, not to whoever posted it.
     */
    Page<Application> findByInternshipCompanyIdOrderByCreatedAtDesc(Long companyId, Pageable pageable);

    /** Ownership-safe lookup for employers. */
    Optional<Application> findByIdAndInternship_Company_Id(Long id, Long companyId);

    /** Applications sitting in one status, oldest first - the stalled queue. */
    Page<Application> findByStatusOrderByCreatedAtAsc(ApplicationStatus status, Pageable pageable);

    long countByStatus(ApplicationStatus status);

    /** Ownership guard used by CertificateService before opening a file. */
    boolean existsByStudentProfileIdAndInternship_Company_Id(Long studentProfileId, Long companyId);

    long countByInternship_Company_Id(Long companyId);

    long countByInternshipId(Long internshipId);

    /** How many places on this vacancy are already taken. */
    long countByInternshipIdAndStatus(Long internshipId, ApplicationStatus status);

    /**
     * Everyone still waiting on this vacancy.
     *
     * Used when the last place is filled: those applications cannot
     * succeed any more, and leaving them open would have people waiting on
     * a decision that can no longer go their way.
     */
    List<Application> findByInternshipIdAndStatusNotIn(
            Long internshipId, Collection<ApplicationStatus> statuses);
    long countByInternship_Company_IdAndStatus(Long companyId, ApplicationStatus status);

}

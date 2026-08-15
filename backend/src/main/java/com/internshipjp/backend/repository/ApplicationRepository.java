package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.ApplicationStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

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

    /** Ownership-safe lookup for employers. */
    Optional<Application> findByIdAndInternship_Company_Id(Long id, Long companyId);

    /** Used by CertificateService to decide whether an employer may open a file. */
    boolean existsByStudentProfileIdAndInternship_Company_Id(Long studentProfileId, Long companyId);

    long countByInternshipId(Long internshipId);

    long countByInternship_Company_Id(Long companyId);
    long countByInternship_Company_IdAndStatus(Long companyId, ApplicationStatus status);

}

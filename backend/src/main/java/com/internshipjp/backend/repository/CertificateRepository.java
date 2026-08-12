package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.VerificationStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Certificates.
 *
 * NOTE the two 'verified' finders: employer-facing code must always use one
 * of those, never findByStudentProfileId. Owner: Member 2 + Member 4.
 */
@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByStudentProfileIdOrderByCreatedAtDesc(Long studentProfileId);
    Optional<Certificate> findByIdAndStudentProfileId(Long id, Long studentProfileId);
    Page<Certificate> findByVerificationStatus(VerificationStatus status, Pageable pageable);

    /** Employer-safe: verified certificates only. */
    List<Certificate> findByStudentProfileIdAndVerificationStatus(Long studentProfileId, VerificationStatus status);

    long countByVerificationStatus(VerificationStatus status);

}

package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;

/**
 * Companies and their approval state. Owner: Member 3 / Member 4.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Page<Company> findByApprovalStatus(ApprovalStatus status, Pageable pageable);

    Page<Company> findByApprovalStatusOrderByCreatedAtAsc(ApprovalStatus status, Pageable pageable);
    long countByApprovalStatus(ApprovalStatus status);

    /**
     * The company holding this registration number, if one is already here.
     *
     * Case-insensitive, because a number typed as "sg-1234" and "SG-1234" is
     * the same company and the second person to register should not create a
     * second row for it.
     *
     * Returns Optional rather than a List even though the column has no unique
     * constraint: the application is what keeps it unique, and returning one
     * result says that is the intent. The constraint is deliberately not in a
     * migration - see the note in AuthService.
     */
    Optional<Company> findFirstByRegistrationNumberIgnoreCase(String registrationNumber);

    /** Used by the demo-data seeder to find and remove only its own rows. */
    List<Company> findByNameStartingWith(String prefix);

}

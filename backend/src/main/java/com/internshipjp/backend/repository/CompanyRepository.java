package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

/**
 * Companies and their approval state. Owner: Member 3 / Member 4.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Page<Company> findByApprovalStatus(ApprovalStatus status, Pageable pageable);

    Page<Company> findByApprovalStatusOrderByCreatedAtAsc(ApprovalStatus status, Pageable pageable);
    long countByApprovalStatus(ApprovalStatus status);

    /** Used by the demo-data seeder to find and remove only its own rows. */
    List<Company> findByNameStartingWith(String prefix);

}

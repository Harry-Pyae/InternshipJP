package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.ApprovalStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Companies and their approval state. Owner: Member 3 / Member 4.
 */
@Repository
public interface CompanyRepository extends JpaRepository<Company, Long> {

    Page<Company> findByApprovalStatus(ApprovalStatus status, Pageable pageable);
    long countByApprovalStatus(ApprovalStatus status);

}

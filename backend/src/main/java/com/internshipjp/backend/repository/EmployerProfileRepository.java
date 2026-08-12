package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.EmployerProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Employer-to-company links. Owner: Member 3.
 */
@Repository
public interface EmployerProfileRepository extends JpaRepository<EmployerProfile, Long> {

    Optional<EmployerProfile> findByUserId(Long userId);

    /** Every recruiter attached to one company - used when a company is approved. */
    List<EmployerProfile> findByCompanyId(Long companyId);

}

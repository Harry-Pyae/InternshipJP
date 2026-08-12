package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.ApplicationStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Audit trail of application decisions. Owner: Member 3.
 */
@Repository
public interface ApplicationStatusHistoryRepository extends JpaRepository<ApplicationStatusHistory, Long> {

    List<ApplicationStatusHistory> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);

}

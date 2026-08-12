package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Operational log of AI provider calls, used by the admin AI oversight
 * screen. Owner: Member 1.
 */
@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    Page<AiUsageLog> findAllByOrderByCreatedAtDesc(Pageable pageable);
    long countBySuccess(boolean success);

}

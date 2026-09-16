package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.ApplicationMessage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationMessageRepository extends JpaRepository<ApplicationMessage, Long> {

    /** The whole exchange about one application, oldest first. */
    List<ApplicationMessage> findByApplicationIdOrderByCreatedAtAsc(Long applicationId);
}

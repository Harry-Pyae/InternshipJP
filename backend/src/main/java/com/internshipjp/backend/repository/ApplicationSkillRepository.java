package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.ApplicationSkill;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ApplicationSkillRepository extends JpaRepository<ApplicationSkill, Long> {

    /** The skills recorded with this application, in the order they are shown. */
    List<ApplicationSkill> findByApplicationIdOrderByNameAsc(Long applicationId);
}

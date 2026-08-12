package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.InternshipSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Skills required by an internship. Owner: Member 3.
 */
@Repository
public interface InternshipSkillRepository extends JpaRepository<InternshipSkill, Long> {

    List<InternshipSkill> findByInternshipId(Long internshipId);
    void deleteByInternshipId(Long internshipId);

}

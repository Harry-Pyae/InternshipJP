package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.StudentSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Technical and soft skills. Owner: Member 2.
 */
@Repository
public interface StudentSkillRepository extends JpaRepository<StudentSkill, Long> {

    List<StudentSkill> findByStudentProfileIdOrderByNameAsc(Long studentProfileId);
    Optional<StudentSkill> findByIdAndStudentProfileId(Long id, Long studentProfileId);
    boolean existsByStudentProfileIdAndNameIgnoreCase(Long studentProfileId, String name);

}

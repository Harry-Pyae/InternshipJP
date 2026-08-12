package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.StudentEducation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Academic records. Owner: Member 2.
 */
@Repository
public interface StudentEducationRepository extends JpaRepository<StudentEducation, Long> {

    List<StudentEducation> findByStudentProfileIdOrderByEndYearDesc(Long studentProfileId);
    Optional<StudentEducation> findByIdAndStudentProfileId(Long id, Long studentProfileId);

}

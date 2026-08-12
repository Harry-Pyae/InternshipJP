package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.StudentResume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Resume file metadata. Owner: Member 2.
 */
@Repository
public interface StudentResumeRepository extends JpaRepository<StudentResume, Long> {

    List<StudentResume> findByStudentProfileIdOrderByCreatedAtDesc(Long studentProfileId);
    Optional<StudentResume> findByIdAndStudentProfileId(Long id, Long studentProfileId);

}

package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.StudentInterest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Career interests. Owner: Member 2.
 */
@Repository
public interface StudentInterestRepository extends JpaRepository<StudentInterest, Long> {

    List<StudentInterest> findByStudentProfileId(Long studentProfileId);

}

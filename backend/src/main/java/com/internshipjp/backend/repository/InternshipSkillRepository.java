package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.InternshipSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.InternshipStatus;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

/**
 * Skills required by an internship. Owner: Member 3.
 */
@Repository
public interface InternshipSkillRepository extends JpaRepository<InternshipSkill, Long> {

    List<InternshipSkill> findByInternshipId(Long internshipId);
    void deleteByInternshipId(Long internshipId);

    /**
     * Every required skill across all internships in one status.
     *
     * Used to work out what the platform is actually asking for. Aggregated in
     * Java rather than in SQL - at university-project scale that is a handful
     * of rows, and readable code beats a clever query nobody can maintain.
     */
    @Query("SELECT k FROM InternshipSkill k WHERE k.internship.status = :status")
    List<InternshipSkill> findAllByInternshipStatus(@Param("status") InternshipStatus status);

    @Query("SELECT k FROM InternshipSkill k WHERE k.internship.company.id = :companyId")
    List<InternshipSkill> findAllByCompanyId(@Param("companyId") Long companyId);

}

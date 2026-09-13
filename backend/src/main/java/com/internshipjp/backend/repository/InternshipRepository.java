package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Internship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.InternshipStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;

/**
 * Internships.
 *
 * Future work: add filtering by work mode, location and required skills.
 */
@Repository
public interface InternshipRepository extends JpaRepository<Internship, Long> {

    Page<Internship> findByStatus(InternshipStatus status, Pageable pageable);
    Page<Internship> findByCompanyId(Long companyId, Pageable pageable);
    Optional<Internship> findByIdAndCompanyId(Long id, Long companyId);
    long countByCompanyIdAndStatus(Long companyId, InternshipStatus status);

    /** All of one company's internships, for the employer insight report. */
    List<Internship> findByCompanyId(Long companyId);

    long countByStatus(InternshipStatus status);

    /**
     * Simple keyword search over the public list. Parameters are bound by JPA,
     * never concatenated into the query string.
     */
    @Query("SELECT i FROM Internship i WHERE i.status = :status AND ("
            + "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.company.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Internship> searchOpen(@Param("status") InternshipStatus status,
                                @Param("keyword") String keyword,
                                Pageable pageable);

         /**
     * The public list, with passed deadlines excluded.
     *
     * A deadline was previously checked only when somebody tried to apply, so a
     * vacancy three weeks past its closing date still appeared in browse and
     * still counted in the reports. Filtering here means the rule holds
     * wherever the list is read, with nothing running on a timer to drift.
     *
     * A null deadline means the employer did not want a cut-off.
     */
    @Query("SELECT i FROM Internship i WHERE i.status = :status "
            + "AND (i.applicationDeadline IS NULL OR i.applicationDeadline >= :today)")
    Page<Internship> findOpenAndNotExpired(@Param("status") InternshipStatus status,
                                           @Param("today") LocalDate today,
                                           Pageable pageable);

    @Query("SELECT i FROM Internship i WHERE i.status = :status "
            + "AND (i.applicationDeadline IS NULL OR i.applicationDeadline >= :today) AND ("
            + "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.company.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Internship> searchOpenAndNotExpired(@Param("status") InternshipStatus status,
                                             @Param("keyword") String keyword,
                                             @Param("today") LocalDate today,
                                             Pageable pageable);

    /** Admin search: one status, plus a keyword across title/company/location. */
         
    @Query("SELECT i FROM Internship i WHERE i.status = :status AND ("
            + "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.company.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Internship> findByStatusAndKeyword(@Param("status") InternshipStatus status,
                                            @Param("keyword") String keyword,
                                            Pageable pageable);

    /** Admin search: keyword across title/company/location, any status. */
    @Query("SELECT i FROM Internship i WHERE "
            + "LOWER(i.title) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.company.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR "
            + "LOWER(i.location) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Internship> searchAll(@Param("keyword") String keyword, Pageable pageable);

}

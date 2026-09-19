package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * In-app notifications.
 *
 * Future work: filtering by type. Nothing removes a notification one at a
 * time; the only thing that deletes any is the administrator's compaction,
 * which takes read notifications past a retention window and leaves every
 * unread one alone.
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    Optional<Notification> findByIdAndUserId(Long id, Long userId);
    long countByUserIdAndReadFalse(Long userId);

    @Modifying
    @Query("UPDATE Notification n SET n.read = true, n.readAt = :now "
            + "WHERE n.user.id = :userId AND n.read = false")
    int markAllRead(@Param("userId") Long userId, @Param("now") LocalDateTime now);

    /**
     * Read notifications older than the cutoff - the only ones compaction may
     * remove. An unread notification is something the person has not seen yet,
     * so age alone is never enough to delete it.
     */
    long countByReadTrueAndCreatedAtBefore(LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM Notification n WHERE n.read = true AND n.createdAt < :cutoff")
    int deleteReadBefore(@Param("cutoff") LocalDateTime cutoff);

}

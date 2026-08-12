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
 * TODO MEMBER_4: add filtering by type and a delete/archive rule.
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

}

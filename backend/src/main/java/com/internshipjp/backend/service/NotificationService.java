package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.response.NotificationResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.entity.Notification;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.NotificationMapper;
import com.internshipjp.backend.repository.NotificationRepository;
import com.internshipjp.backend.repository.UserRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Creates and reads in-app notifications.
 *
 * Other services call create(...) whenever something happens that a user
 * should know about. Two flows already use it, as working examples:
 *   - employer registration notifies the administrators
 *   - an application status change notifies the student
 *
 * TODO MEMBER_4: extend this with notification preferences, grouping by type,
 * and the React notification centre. The backend contract below is stable, so
 * you can build the UI against it immediately.
 */
@Service
public class NotificationService {

    /** How many administrators one broadcast will reach. Plenty for this project. */
    private static final int ADMIN_FANOUT_LIMIT = 50;

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationMapper notificationMapper;

    public NotificationService(NotificationRepository notificationRepository,
                               UserRepository userRepository,
                               NotificationMapper notificationMapper) {
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.notificationMapper = notificationMapper;
    }

    @Transactional
    public Notification create(User recipient, String type, String title, String message) {
        Notification notification = new Notification();
        notification.setUser(recipient);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setRead(false);
        return notificationRepository.save(notification);
    }

    /** Sends the same notification to every administrator. */
    @Transactional
    public void notifyAdmins(String type, String title, String message) {
        List<User> admins = userRepository
                .findByRole(Role.ADMIN, PageRequest.of(0, ADMIN_FANOUT_LIMIT))
                .getContent();
        for (User admin : admins) {
            create(admin, type, title, message);
        }
    }

    @Transactional(readOnly = true)
    public PageResponse<NotificationResponse> list(Long userId, Pageable pageable) {
        return PageResponse.from(
                notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable),
                notificationMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public long unreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    /** Ownership is enforced by looking the row up with both ids. */
    @Transactional
    public NotificationResponse markRead(Long notificationId, Long userId) {
        Notification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> NotFoundException.of("Notification", notificationId));
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(LocalDateTime.now());
            notificationRepository.save(notification);
        }
        return notificationMapper.toResponse(notification);
    }

    @Transactional
    public int markAllRead(Long userId) {
        return notificationRepository.markAllRead(userId, LocalDateTime.now());
    }
}

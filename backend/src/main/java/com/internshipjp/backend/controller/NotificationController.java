package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.dto.response.NotificationResponse;
import com.internshipjp.backend.dto.response.PageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.NotificationService;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Notifications for the signed-in user, whatever their role.
 *
 * There is no endpoint for reading someone else's notifications, and no
 * endpoint for creating one: notifications are produced by the services when
 * something actually happens.
 *
 * TODO MEMBER_4: add the unread badge count endpoint if you want the bell to
 * poll something cheaper than the full list, plus the React notification centre.
 *
 * Owner: Member 4.
 */
@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private static final int MAX_PAGE_SIZE = 50;

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public NotificationController(NotificationService notificationService,
                                  CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @GetMapping
    public PageResponse<NotificationResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        int safeSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        return notificationService.list(currentUserService.requireUserId(),
                PageRequest.of(Math.max(page, 0), safeSize));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id) {
        return notificationService.markRead(id, currentUserService.requireUserId());
    }

    @PatchMapping("/read-all")
    public ApiMessageResponse markAllRead() {
        int updated = notificationService.markAllRead(currentUserService.requireUserId());
        return new ApiMessageResponse(updated + " notification(s) marked as read.");
    }
}

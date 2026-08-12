package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.NotificationResponse;
import com.internshipjp.backend.entity.Notification;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/** Entity -> DTO conversion for notifications. */
@Component
public class NotificationMapper {

    public NotificationResponse toResponse(Notification notification) {
        NotificationResponse dto = new NotificationResponse();
        dto.setId(notification.getId());
        dto.setType(notification.getType());
        dto.setTitle(notification.getTitle());
        dto.setMessage(notification.getMessage());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(Dates.format(notification.getCreatedAt()));
        dto.setReadAt(Dates.format(notification.getReadAt()));
        return dto;
    }
}

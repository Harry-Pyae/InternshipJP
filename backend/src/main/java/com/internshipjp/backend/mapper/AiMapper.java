package com.internshipjp.backend.mapper;

import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.entity.AiConversation;
import com.internshipjp.backend.entity.AiMessage;
import com.internshipjp.backend.util.Dates;
import org.springframework.stereotype.Component;

/** Entity -> DTO conversion for AI history. */
@Component
public class AiMapper {

    public AiConversationResponse toConversation(AiConversation conversation) {
        AiConversationResponse dto = new AiConversationResponse();
        dto.setId(conversation.getId());
        dto.setConversationType(conversation.getConversationType().name());
        dto.setTitle(conversation.getTitle());
        dto.setContextReferenceId(conversation.getContextReferenceId());
        dto.setCreatedAt(Dates.format(conversation.getCreatedAt()));
        dto.setUpdatedAt(Dates.format(conversation.getUpdatedAt()));
        return dto;
    }

    public AiMessageResponse toMessage(AiMessage message) {
        AiMessageResponse dto = new AiMessageResponse();
        dto.setId(message.getId());
        dto.setMessageRole(message.getMessageRole().name());
        dto.setContent(message.getContent());
        dto.setCreatedAt(Dates.format(message.getCreatedAt()));
        return dto;
    }
}

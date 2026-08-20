package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.entity.AiConversation;
import com.internshipjp.backend.entity.AiConversationType;
import com.internshipjp.backend.entity.AiMessage;
import com.internshipjp.backend.entity.AiMessageRole;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.NotFoundException;
import com.internshipjp.backend.mapper.AiMapper;
import com.internshipjp.backend.repository.AiConversationRepository;
import com.internshipjp.backend.repository.AiMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Stores and reads AI chat history.
 *
 * OWNERSHIP
 *   Every read is looked up with (conversationId, ownerUserId) together, so a
 *   user cannot open another user's conversation by guessing an id.
 *
 * WHAT IS STORED
 *   The user's question and the assistant's answer. The assembled context
 *   block - profile rows, applicant details, verified certificates - is NOT
 *   written to the database. It can always be rebuilt from live data, and
 *   keeping copies of personal data in a chat log is exactly the kind of
 *   duplication that turns one leak into two.
 */
@Service
public class AiConversationService {

    /** Matches the VARCHAR(8000) column in the ai_messages table. */
    private static final int MAX_CONTENT_LENGTH = 8000;

    private final AiConversationRepository conversationRepository;
    private final AiMessageRepository messageRepository;
    private final AiMapper aiMapper;

    public AiConversationService(AiConversationRepository conversationRepository,
                                 AiMessageRepository messageRepository,
                                 AiMapper aiMapper) {
        this.conversationRepository = conversationRepository;
        this.messageRepository = messageRepository;
        this.aiMapper = aiMapper;
    }

    /**
     * Continues the given conversation, or starts a new one when the request
     * did not name one.
     */
    @Transactional
    public AiConversation resolveConversation(User owner, Long conversationId,
                                              AiConversationType type, Long contextReferenceId,
                                              String firstMessage) {
        if (conversationId != null) {
            return conversationRepository.findByIdAndOwnerId(conversationId, owner.getId())
                    .orElseThrow(() -> NotFoundException.of("Conversation", conversationId));
        }
        AiConversation conversation = new AiConversation();
        conversation.setOwner(owner);
        conversation.setConversationType(type);
        conversation.setContextReferenceId(contextReferenceId);
        conversation.setTitle(buildTitle(firstMessage));
        return conversationRepository.save(conversation);
    }

    @Transactional
    public AiMessage addMessage(AiConversation conversation, AiMessageRole role, String content) {
        AiMessage message = new AiMessage();
        message.setConversation(conversation);
        message.setMessageRole(role);
        message.setContent(truncate(content));
        AiMessage saved = messageRepository.save(message);

        // Keeps the history list sorted by "most recently used".
        conversation.setUpdatedAt(LocalDateTime.now());
        conversationRepository.save(conversation);
        return saved;
    }

    /**
     * The last few turns, so the assistant remembers the thread.
     *
     * WHY REPLAYED MESSAGES ARE SHORTENED
     *   A chat API is stateless: every previous message is sent again with
     *   every new question. An 8000-character answer replayed four times is
     *   32000 characters of request, on top of the context block - which is
     *   enough for a free-tier provider to refuse the request entirely.
     *
     *   What the thread needs from an old answer is the gist, not the whole
     *   thing. The full text stays in the database and is still shown in the
     *   UI; only the copy sent back to the provider is trimmed.
     */
    private static final int REPLAYED_MESSAGE_LIMIT = 1200;

    @Transactional(readOnly = true)
    public List<AiChatMessage> recentTurns(Long conversationId, int maxMessages) {
        List<AiMessage> stored = messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
        int from = Math.max(0, stored.size() - maxMessages);
        return stored.subList(from, stored.size()).stream()
                .map(message -> {
                    String content = shorten(message.getContent());
                    return message.getMessageRole() == AiMessageRole.USER
                            ? AiChatMessage.user(content)
                            : AiChatMessage.assistant(content);
                })
                .toList();
    }

    private String shorten(String content) {
        if (content == null || content.length() <= REPLAYED_MESSAGE_LIMIT) {
            return content == null ? "" : content;
        }
        return content.substring(0, REPLAYED_MESSAGE_LIMIT) + "\n[earlier answer shortened]";
    }

    @Transactional(readOnly = true)
    public List<AiConversationResponse> listConversations(Long ownerUserId) {
        return conversationRepository.findByOwnerIdOrderByUpdatedAtDesc(ownerUserId)
                .stream().map(aiMapper::toConversation).toList();
    }

    @Transactional(readOnly = true)
    public List<AiMessageResponse> listMessages(Long ownerUserId, Long conversationId) {
        AiConversation conversation = conversationRepository
                .findByIdAndOwnerId(conversationId, ownerUserId)
                .orElseThrow(() -> NotFoundException.of("Conversation", conversationId));
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId())
                .stream().map(aiMapper::toMessage).toList();
    }

    /**
     * Deletes one of the caller's own conversations, and its messages with it
     * (the ai_messages foreign key cascades).
     *
     * Looking the row up by (id, ownerId) together is what makes this safe:
     * passing someone else's conversation id gives a 404, not a deletion.
     */
    @Transactional
    public void deleteConversation(Long ownerUserId, Long conversationId) {
        AiConversation conversation = conversationRepository
                .findByIdAndOwnerId(conversationId, ownerUserId)
                .orElseThrow(() -> NotFoundException.of("Conversation", conversationId));
        conversationRepository.delete(conversation);
    }

    private String buildTitle(String firstMessage) {
        if (firstMessage == null || firstMessage.isBlank()) {
            return "New conversation";
        }
        String trimmed = firstMessage.strip();
        return trimmed.length() <= 60 ? trimmed : trimmed.substring(0, 57) + "...";
    }

    private String truncate(String content) {
        if (content == null) {
            return "";
        }
        return content.length() <= MAX_CONTENT_LENGTH
                ? content
                : content.substring(0, MAX_CONTENT_LENGTH - 3) + "...";
    }
}

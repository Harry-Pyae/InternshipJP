package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

/**
 * Messages inside an AI conversation. Owner: Member 1.
 */
@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    long countByConversationId(Long conversationId);

}

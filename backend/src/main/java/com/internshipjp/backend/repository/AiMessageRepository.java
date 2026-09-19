package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.AiMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Messages inside an AI conversation. Owner: Member 1.
 */
@Repository
public interface AiMessageRepository extends JpaRepository<AiMessage, Long> {

    List<AiMessage> findByConversationIdOrderByCreatedAtAsc(Long conversationId);
    long countByConversationId(Long conversationId);

    /**
     * Messages belonging to threads compaction is about to remove.
     *
     * The foreign key is ON DELETE CASCADE, so the database would clear these
     * on its own. They are counted and deleted explicitly anyway, so the
     * figure reported to the administrator is a real one rather than an
     * estimate, and so the behaviour does not silently depend on a constraint
     * written in a migration file.
     */
    @Query("SELECT COUNT(m) FROM AiMessage m WHERE m.conversation.updatedAt < :cutoff")
    long countInConversationsBefore(@Param("cutoff") LocalDateTime cutoff);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("DELETE FROM AiMessage m WHERE m.conversation.id IN "
            + "(SELECT c.id FROM AiConversation c WHERE c.updatedAt < :cutoff)")
    int deleteInConversationsBefore(@Param("cutoff") LocalDateTime cutoff);

}

package com.internshipjp.backend.repository;

import com.internshipjp.backend.entity.AiConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.internshipjp.backend.entity.AiConversationType;
import java.util.List;
import java.util.Optional;

/**
 * AI chat threads. Every finder is scoped by owner so one user can never
 * read another user's conversation. Owner: Member 1.
 */
@Repository
public interface AiConversationRepository extends JpaRepository<AiConversation, Long> {

    List<AiConversation> findByOwnerIdOrderByUpdatedAtDesc(Long ownerId);
    Optional<AiConversation> findByIdAndOwnerId(Long id, Long ownerId);
    List<AiConversation> findByOwnerIdAndConversationTypeOrderByUpdatedAtDesc(Long ownerId, AiConversationType type);

}

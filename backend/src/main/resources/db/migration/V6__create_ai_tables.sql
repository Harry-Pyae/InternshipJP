-- ===========================================================================
-- V6 - AI conversations, messages and usage logs
-- Owner: Member 1 (integration / AI)
--
-- PRIVACY NOTE
--   ai_messages stores what the user typed and what the assistant answered.
--   It deliberately does NOT store the assembled prompt context (profile
--   rows, applicant details). ai_usage_logs stores operational data only -
--   provider, model, timing, success/failure - never prompt content.
-- ===========================================================================

CREATE TABLE ai_conversations (
    id                   BIGINT       NOT NULL AUTO_INCREMENT,
    owner_user_id        BIGINT       NOT NULL,
    -- STUDENT_GUIDANCE | EMPLOYER_COMPARISON
    conversation_type    VARCHAR(30)  NOT NULL,
    title                VARCHAR(200) NULL,
    -- Optional focus of the conversation, e.g. the internship being discussed.
    context_reference_id BIGINT       NULL,
    created_at           DATETIME(6)  NOT NULL,
    updated_at           DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ai_conversation_owner FOREIGN KEY (owner_user_id)
        REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ai_messages (
    id              BIGINT        NOT NULL AUTO_INCREMENT,
    conversation_id BIGINT        NOT NULL,
    -- USER | ASSISTANT
    message_role    VARCHAR(20)   NOT NULL,
    -- Long answers are truncated to this length by AiConversationService.
    content         VARCHAR(8000) NOT NULL,
    created_at      DATETIME(6)   NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ai_message_conversation FOREIGN KEY (conversation_id)
        REFERENCES ai_conversations (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE ai_usage_logs (
    id                BIGINT       NOT NULL AUTO_INCREMENT,
    user_id           BIGINT       NULL,
    -- STUDENT_CHAT | EMPLOYER_CHAT | CONNECTION_TEST
    feature           VARCHAR(50)  NOT NULL,
    provider          VARCHAR(30)  NOT NULL,
    model             VARCHAR(100) NULL,
    success           BOOLEAN      NOT NULL,
    http_status       INT          NULL,
    -- Short, safe reason such as MISSING_API_KEY or PROVIDER_TIMEOUT.
    error_code        VARCHAR(100) NULL,
    prompt_tokens     INT          NULL,
    completion_tokens INT          NULL,
    total_tokens      INT          NULL,
    duration_ms       BIGINT       NULL,
    created_at        DATETIME(6)  NOT NULL,
    PRIMARY KEY (id),
    CONSTRAINT fk_ai_usage_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

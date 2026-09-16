-- What was actually said about an application.
--
-- Messages were only ever created as notifications. A notification belongs to
-- one recipient, so an employer's inbox held what a student wrote and nothing
-- the employer wrote back. Landing on the application showed neither, because
-- the text had never been stored against the application at all.
--
-- Keeping them here makes the exchange readable by both sides, in order, beside
-- the decision it concerns. The notification goes back to being what it should
-- be: a pointer saying there is something new, not the place the content lives.
--
-- SAFE ON AN EXISTING DATABASE
--   It only creates a table. Nothing is altered or constrained, so no existing
--   row has to satisfy anything. Applications that exchanged messages before
--   this migration have none here, and their thread reads as empty - which is
--   accurate, because those words were never kept.

CREATE TABLE application_messages (
    id             BIGINT       NOT NULL AUTO_INCREMENT,
    application_id BIGINT       NOT NULL,
    sender_id      BIGINT       NOT NULL,
    -- EMPLOYER or STUDENT. Stored rather than derived, so a thread can be read
    -- without loading both profiles to work out who said what.
    sender_role    VARCHAR(20)  NOT NULL,
    body           VARCHAR(500) NOT NULL,
    created_at     DATETIME(6)  NOT NULL,

    PRIMARY KEY (id),
    CONSTRAINT fk_application_message_application
        FOREIGN KEY (application_id) REFERENCES applications (id)
        ON DELETE CASCADE,
    CONSTRAINT fk_application_message_sender
        FOREIGN KEY (sender_id) REFERENCES users (id),
    KEY idx_application_message_thread (application_id, created_at)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COLLATE = utf8mb4_general_ci;

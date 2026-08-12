-- ===========================================================================
-- V7 - Indexes for the queries this application actually runs
--
-- Foreign key columns already get an index automatically in InnoDB, so this
-- file only adds indexes for filtering and sorting.
-- ===========================================================================

-- Admin user list: filter by role and status.
CREATE INDEX idx_users_role_status ON users (role, account_status);

-- Login challenge lookup: newest unconsumed challenge for a user + purpose.
CREATE INDEX idx_email_otp_lookup ON email_otp_challenges (user_id, purpose, expires_at);

-- Admin queue: companies waiting for approval.
CREATE INDEX idx_companies_approval ON companies (approval_status);

-- Public internship browsing: open jobs, newest first, deadline filtering.
CREATE INDEX idx_internships_status_created ON internships (status, created_at);
CREATE INDEX idx_internships_deadline ON internships (application_deadline);

-- Employer applicant lists and student application history.
CREATE INDEX idx_applications_status ON applications (status);
CREATE INDEX idx_applications_student_status ON applications (student_profile_id, status);

-- Admin certificate queue + the employer "verified only" filter.
CREATE INDEX idx_certificates_status ON certificates (verification_status);
CREATE INDEX idx_certificates_student_status ON certificates (student_profile_id, verification_status);

-- Notification bell: unread items for one user, newest first.
CREATE INDEX idx_notifications_user_read ON notifications (user_id, is_read, created_at);

-- AI history and admin AI oversight.
CREATE INDEX idx_ai_conversations_owner ON ai_conversations (owner_user_id, updated_at);
CREATE INDEX idx_ai_messages_conversation ON ai_messages (conversation_id, created_at);
CREATE INDEX idx_ai_usage_created ON ai_usage_logs (created_at);

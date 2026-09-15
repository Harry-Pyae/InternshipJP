-- Which record a notification is about.
--
-- Until now a notification carried a type and a message and nothing else, so
-- clicking one could only open the queue it belonged to. "Your application was
-- updated" took a student to their list of applications and left them to find
-- which one.
--
-- SAFE ON AN EXISTING DATABASE
--   One nullable column added. Nothing is altered, nothing is constrained, and
--   no existing row has to satisfy anything. Notifications created before this
--   have NULL, and the interface falls back to the queue for those - the
--   behaviour they were created under.
--
-- NOT A FOREIGN KEY, ON PURPOSE
--   The id points at a different table depending on the type: an application,
--   a certificate, a company. A constraint can only name one of them, and a
--   record being deleted should not take the notice of it with it.

ALTER TABLE notifications
    ADD COLUMN reference_id BIGINT NULL AFTER type;

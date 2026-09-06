package com.internshipjp.backend.dto.response;

/**
 * How many notifications the signed-in user has not read.
 *
 * A whole class for one number looks like overkill, but returning a bare
 * integer as JSON gives you `5` rather than `{"unread": 5}` - which cannot
 * later gain a field without breaking every caller.
 */
public class UnreadCountResponse {

    private long unread;

    public UnreadCountResponse() {
    }

    public UnreadCountResponse(long unread) {
        this.unread = unread;
    }

    public long getUnread() {
        return unread;
    }

    public void setUnread(long unread) {
        this.unread = unread;
    }
}

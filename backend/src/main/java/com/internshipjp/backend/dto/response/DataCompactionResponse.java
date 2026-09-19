package com.internshipjp.backend.dto.response;

/**
 * What a compaction would remove, or what one did remove.
 *
 * The same shape answers both the preview and the run, with {@code applied}
 * saying which it was. An administrator should never have to guess how much a
 * button is about to delete, so the preview is the same count, computed the
 * same way, from the same service.
 *
 * Owner: Member 4.
 */
public class DataCompactionResponse {

    private boolean applied;
    private int retentionDays;
    private String cutoff;

    private long expiredOtpChallenges;
    private long aiUsageLogs;
    private long readNotifications;
    private long aiConversations;
    private long aiMessages;
    private long totalRows;

    public boolean isApplied() {
        return applied;
    }

    public void setApplied(boolean applied) {
        this.applied = applied;
    }

    public int getRetentionDays() {
        return retentionDays;
    }

    public void setRetentionDays(int retentionDays) {
        this.retentionDays = retentionDays;
    }

    public String getCutoff() {
        return cutoff;
    }

    public void setCutoff(String cutoff) {
        this.cutoff = cutoff;
    }

    public long getExpiredOtpChallenges() {
        return expiredOtpChallenges;
    }

    public void setExpiredOtpChallenges(long expiredOtpChallenges) {
        this.expiredOtpChallenges = expiredOtpChallenges;
    }

    public long getAiUsageLogs() {
        return aiUsageLogs;
    }

    public void setAiUsageLogs(long aiUsageLogs) {
        this.aiUsageLogs = aiUsageLogs;
    }

    public long getReadNotifications() {
        return readNotifications;
    }

    public void setReadNotifications(long readNotifications) {
        this.readNotifications = readNotifications;
    }

    public long getAiConversations() {
        return aiConversations;
    }

    public void setAiConversations(long aiConversations) {
        this.aiConversations = aiConversations;
    }

    public long getAiMessages() {
        return aiMessages;
    }

    public void setAiMessages(long aiMessages) {
        this.aiMessages = aiMessages;
    }

    public long getTotalRows() {
        return totalRows;
    }

    public void setTotalRows(long totalRows) {
        this.totalRows = totalRows;
    }
}

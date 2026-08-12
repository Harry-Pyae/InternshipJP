package com.internshipjp.backend.ai;

/** What an AI provider gave back, including the numbers we log for oversight. */
public class AiCompletion {

    private final String content;
    private final String model;
    private final Integer promptTokens;
    private final Integer completionTokens;
    private final Integer totalTokens;
    private final long durationMs;

    public AiCompletion(String content, String model, Integer promptTokens,
                        Integer completionTokens, Integer totalTokens, long durationMs) {
        this.content = content;
        this.model = model;
        this.promptTokens = promptTokens;
        this.completionTokens = completionTokens;
        this.totalTokens = totalTokens;
        this.durationMs = durationMs;
    }

    public String getContent() {
        return content;
    }

    public String getModel() {
        return model;
    }

    public Integer getPromptTokens() {
        return promptTokens;
    }

    public Integer getCompletionTokens() {
        return completionTokens;
    }

    public Integer getTotalTokens() {
        return totalTokens;
    }

    public long getDurationMs() {
        return durationMs;
    }
}

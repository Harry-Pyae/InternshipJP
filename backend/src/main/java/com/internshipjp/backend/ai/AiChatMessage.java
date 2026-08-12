package com.internshipjp.backend.ai;

/**
 * One message in the request sent to an AI provider.
 *
 * Deliberately provider-neutral: "system", "user" and "assistant" are the
 * roles every current chat API understands, so swapping Groq for another
 * provider does not change this class.
 */
public class AiChatMessage {

    private final String role;
    private final String content;

    private AiChatMessage(String role, String content) {
        this.role = role;
        this.content = content;
    }

    public static AiChatMessage system(String content) {
        return new AiChatMessage("system", content);
    }

    public static AiChatMessage user(String content) {
        return new AiChatMessage("user", content);
    }

    public static AiChatMessage assistant(String content) {
        return new AiChatMessage("assistant", content);
    }

    public String getRole() {
        return role;
    }

    public String getContent() {
        return content;
    }
}

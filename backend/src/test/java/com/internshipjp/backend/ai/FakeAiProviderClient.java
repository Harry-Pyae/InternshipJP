package com.internshipjp.backend.ai;

import com.internshipjp.backend.exception.ProviderUnavailableException;

import java.util.ArrayList;
import java.util.List;

/**
 * A stand-in for a real AI provider, for tests.
 *
 * This class is the reason AiProviderClient exists as an interface: the AI
 * features can be tested with no API key, no network and no cost. It also
 * records what it was asked, so a test can assert that private data never
 * reached the provider.
 *
 * Member 1: use this in any future test of AiService.
 */
public class FakeAiProviderClient implements AiProviderClient {

    private final boolean configured;
    private final boolean shouldFail;
    private final String cannedAnswer;
    private final List<List<AiChatMessage>> receivedRequests = new ArrayList<>();

    public FakeAiProviderClient(boolean configured, boolean shouldFail, String cannedAnswer) {
        this.configured = configured;
        this.shouldFail = shouldFail;
        this.cannedAnswer = cannedAnswer;
    }

    public static FakeAiProviderClient working() {
        return new FakeAiProviderClient(true, false, "Here are three internships that fit your skills.");
    }

    public static FakeAiProviderClient unavailable() {
        return new FakeAiProviderClient(true, true, null);
    }

    public static FakeAiProviderClient notConfigured() {
        return new FakeAiProviderClient(false, true, null);
    }

    @Override
    public String providerName() {
        return "fake";
    }

    @Override
    public boolean isConfigured() {
        return configured;
    }

    @Override
    public AiProviderStatus checkStatus() {
        if (!configured) {
            return new AiProviderStatus("fake", false, false, "fake-model", null,
                    "No API key configured.");
        }
        if (shouldFail) {
            return new AiProviderStatus("fake", true, false, "fake-model", 12L,
                    "Could not reach the provider.");
        }
        return new AiProviderStatus("fake", true, true, "fake-model", 12L, null);
    }

    @Override
    public AiCompletion complete(List<AiChatMessage> messages) {
        receivedRequests.add(List.copyOf(messages));
        if (!configured) {
            throw new ProviderUnavailableException("The AI assistant is not configured on this server yet.");
        }
        if (shouldFail) {
            throw new ProviderUnavailableException("The AI assistant is unavailable right now.");
        }
        return new AiCompletion(cannedAnswer, "fake-model", 120, 40, 160, 15L);
    }

    /** Everything that was sent to the "provider", for assertions. */
    public List<List<AiChatMessage>> getReceivedRequests() {
        return receivedRequests;
    }

    public String lastPromptAsText() {
        if (receivedRequests.isEmpty()) {
            return "";
        }
        StringBuilder builder = new StringBuilder();
        for (AiChatMessage message : receivedRequests.get(receivedRequests.size() - 1)) {
            builder.append(message.getRole()).append(": ").append(message.getContent()).append("\n");
        }
        return builder.toString();
    }
}

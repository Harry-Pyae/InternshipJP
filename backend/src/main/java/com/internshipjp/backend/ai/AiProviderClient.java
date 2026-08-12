package com.internshipjp.backend.ai;

import java.util.List;

/**
 * The boundary between "our application" and "whichever AI vendor we use".
 *
 * Everything above this interface (AiService, the controllers, the React
 * pages) is written against these three methods. Only GroqClient knows about
 * Groq's URL shape, and only GroqClient would have to be replaced to move to
 * another provider.
 *
 * Tests implement this interface with a small fake, which is why the AI
 * features can be tested without a network connection or an API key.
 */
public interface AiProviderClient {

    /** Short name used in logs and in the status endpoint, e.g. "groq". */
    String providerName();

    /** True when an API key is configured. Does not perform a network call. */
    boolean isConfigured();

    /** Performs a real, minimal call to check that the provider answers. */
    AiProviderStatus checkStatus();

    /**
     * Sends a conversation and returns the assistant's reply.
     *
     * @throws com.internshipjp.backend.exception.ProviderUnavailableException
     *         when the provider is not configured, times out, or rejects the call
     */
    AiCompletion complete(List<AiChatMessage> messages);
}

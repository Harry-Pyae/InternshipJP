package com.internshipjp.backend.ai;

import com.internshipjp.backend.exception.ProviderUnavailableException;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Tests the AI seam with a fake provider - no API key and no network needed.
 *
 * The important assertion is the last one: when the provider is unreachable
 * the code raises ProviderUnavailableException (a 503), not a generic error.
 * That is what lets the chat page tell the user "try again later" instead of
 * showing a crash.
 */
class AiProviderClientTest {

    private final List<AiChatMessage> prompt = List.of(
            AiChatMessage.system("You are the InternshipJP career assistant."),
            AiChatMessage.user("Which internships suit me?"));

    @Test
    void returnsTheAnswerAndTheUsageNumbersWhenTheProviderWorks() {
        FakeAiProviderClient provider = FakeAiProviderClient.working();

        AiCompletion completion = provider.complete(prompt);

        assertEquals("Here are three internships that fit your skills.", completion.getContent());
        assertEquals("fake-model", completion.getModel());
        assertEquals(160, completion.getTotalTokens());
    }

    @Test
    void reportsStatusHonestlyWhenNoKeyIsConfigured() {
        AiProviderStatus status = FakeAiProviderClient.notConfigured().checkStatus();

        assertFalse(status.isConfigured());
        assertFalse(status.isReachable());
    }

    @Test
    void reportsConfiguredButUnreachableSeparately() {
        AiProviderStatus status = FakeAiProviderClient.unavailable().checkStatus();

        // These two are different problems and the status endpoint must not
        // collapse them into one.
        assertTrue(status.isConfigured());
        assertFalse(status.isReachable());
    }

    @Test
    void failsWithAProviderUnavailableErrorRatherThanACrash() {
        FakeAiProviderClient provider = FakeAiProviderClient.unavailable();

        assertThrows(ProviderUnavailableException.class, () -> provider.complete(prompt));
    }

    @Test
    void recordsWhatWasSentSoTestsCanCheckForLeakedData() {
        FakeAiProviderClient provider = FakeAiProviderClient.working();

        provider.complete(prompt);

        assertEquals(1, provider.getReceivedRequests().size());
        String sent = provider.lastPromptAsText();
        assertTrue(sent.contains("Which internships suit me?"));
        // A guard worth copying: no secret should ever appear in a prompt.
        assertFalse(sent.toLowerCase().contains("password"));
    }
}

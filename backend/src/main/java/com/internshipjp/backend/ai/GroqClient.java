package com.internshipjp.backend.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.internshipjp.backend.config.AppProperties;
import com.internshipjp.backend.exception.ProviderUnavailableException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

/**
 * Talks to Groq's OpenAI-compatible chat completions API.
 *
 * DESIGN NOTES
 *   - Uses the JDK's own HttpClient. Connect and read timeouts are set
 *     explicitly, because a hanging AI call must never hang a user's request.
 *   - The API key is read from configuration and is never logged, never put
 *     in an error message, and never sent to the browser. React talks to our
 *     backend; only our backend talks to Groq.
 *   - Every failure is converted into ProviderUnavailableException so callers
 *     can degrade gracefully instead of returning a 500.
 */
/*
 * Registered only when app.ai.provider is groq - matchIfMissing keeps it the
 * default. Exactly one AiProviderClient bean exists at a time, so nothing
 * above this class ever has to choose between two.
 */
@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "groq", matchIfMissing = true)
public class GroqClient implements AiProviderClient {

    private static final Logger log = LoggerFactory.getLogger(GroqClient.class);
    private static final String PROVIDER = "groq";

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GroqClient(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(groq().getTimeoutSeconds()))
                .build();
    }

    private AppProperties.Groq groq() {
        return appProperties.getAi().getGroq();
    }

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(groq().getApiKey());
    }

    /**
     * Asks the provider for its model list - the cheapest call that proves
     * both the network path and the API key are good.
     */
    @Override
    public AiProviderStatus checkStatus() {
        if (!isConfigured()) {
            return new AiProviderStatus(PROVIDER, false, false, groq().getModel(), null,
                    "No API key configured. Set GROQ_API_KEY in application-local.properties.");
        }

        long startedAt = System.currentTimeMillis();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(groq().getBaseUrl() + "/models"))
                    .timeout(Duration.ofSeconds(groq().getTimeoutSeconds()))
                    .header("Authorization", "Bearer " + groq().getApiKey())
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startedAt;

            if (response.statusCode() / 100 == 2) {
                return new AiProviderStatus(PROVIDER, true, true, groq().getModel(), latency, null);
            }
            return new AiProviderStatus(PROVIDER, true, false, groq().getModel(), latency,
                    "The provider answered with HTTP " + response.statusCode() + ".");
        } catch (Exception ex) {
            long latency = System.currentTimeMillis() - startedAt;
            log.warn("Groq status check failed: {}", ex.getClass().getSimpleName());
            return new AiProviderStatus(PROVIDER, true, false, groq().getModel(), latency,
                    "Could not reach the provider (" + ex.getClass().getSimpleName() + ").");
        }
    }

    @Override
    public AiCompletion complete(List<AiChatMessage> messages) {
        if (!isConfigured()) {
            throw new ProviderUnavailableException(
                    "The AI assistant is not configured on this server yet.");
        }

        String payload = buildPayload(messages);
        long startedAt = System.currentTimeMillis();

        HttpResponse<String> response;
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(groq().getBaseUrl() + "/chat/completions"))
                    .timeout(Duration.ofSeconds(groq().getTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .header("Authorization", "Bearer " + groq().getApiKey())
                    .POST(HttpRequest.BodyPublishers.ofString(payload, StandardCharsets.UTF_8))
                    .build();
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (java.net.http.HttpTimeoutException ex) {
            throw new ProviderUnavailableException("The AI assistant took too long to answer. Please try again.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ProviderUnavailableException("The AI request was interrupted.");
        } catch (Exception ex) {
            log.warn("Groq call failed: {}", ex.getClass().getSimpleName());
            throw new ProviderUnavailableException("The AI assistant is unavailable right now.");
        }

        long duration = System.currentTimeMillis() - startedAt;

        if (response.statusCode() / 100 != 2) {
            String reason = readErrorMessage(response.body());

            // The reason is logged in full. An operator who cannot see WHY the
            // provider refused has to guess, and the first version of this
            // class logged only the status code - which cost an afternoon.
            log.warn("Groq returned HTTP {}: {}", response.statusCode(), reason);

            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new ProviderUnavailableException(
                        "The AI provider rejected the server's credentials. Check GROQ_API_KEY.");
            }
            if (response.statusCode() == 429) {
                throw new ProviderUnavailableException(
                        "The AI assistant has hit its rate limit. Wait a minute and try again. ("
                                + reason + ")");
            }
            if (response.statusCode() == 413) {
                // Groq returns this when a SINGLE request exceeds the
                // tokens-per-minute allowance. It gets more likely as a
                // conversation grows, which is why it appears after a few
                // successful questions rather than immediately.
                throw new ProviderUnavailableException(
                        "This conversation has grown too large for the AI provider's limit. "
                                + "Start a new conversation and ask again. (" + reason + ")");
            }
            if (response.statusCode() == 404 || response.statusCode() == 400) {
                throw new ProviderUnavailableException(
                        "The AI provider rejected the request. This usually means the configured "
                                + "model no longer exists - check GROQ_MODEL. (" + reason + ")");
            }
            throw new ProviderUnavailableException(
                    "The AI assistant could not answer (HTTP " + response.statusCode()
                            + "): " + reason);
        }

        return parseCompletion(response.body(), duration);
    }

    private String buildPayload(List<AiChatMessage> messages) {
        ObjectNode root = objectMapper.createObjectNode();
        root.put("model", groq().getModel());
        root.put("max_tokens", groq().getMaxOutputTokens());
        root.put("temperature", 0.3);

        ArrayNode array = root.putArray("messages");
        for (AiChatMessage message : messages) {
            ObjectNode node = array.addObject();
            node.put("role", message.getRole());
            node.put("content", message.getContent());
        }
        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            throw new IllegalStateException("Could not build the AI request body", ex);
        }
    }

    /**
     * Pulls the human-readable reason out of a provider error body.
     *
     * Groq answers with { "error": { "message": "...", "code": "..." } }. The
     * message describes the REQUEST ("Request too large ... Limit 6000,
     * Requested 12043"), never the API key, so it is safe to show. It is
     * trimmed because an error body is not a place for a wall of text.
     */
    private String readErrorMessage(String body) {
        if (!StringUtils.hasText(body)) {
            return "no detail returned";
        }
        try {
            JsonNode error = objectMapper.readTree(body).path("error");
            String message = error.path("message").asText("");
            if (!StringUtils.hasText(message)) {
                message = body;
            }
            return message.length() > 200 ? message.substring(0, 197) + "..." : message;
        } catch (Exception ex) {
            String trimmed = body.strip();
            return trimmed.length() > 200 ? trimmed.substring(0, 197) + "..." : trimmed;
        }
    }

    private AiCompletion parseCompletion(String body, long durationMs) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode choices = root.path("choices");
            if (!choices.isArray() || choices.isEmpty()) {
                throw new ProviderUnavailableException("The AI assistant returned an empty answer.");
            }
            String content = choices.get(0).path("message").path("content").asText("").trim();
            if (content.isEmpty()) {
                throw new ProviderUnavailableException("The AI assistant returned an empty answer.");
            }

            JsonNode usage = root.path("usage");
            return new AiCompletion(
                    content,
                    root.path("model").asText(groq().getModel()),
                    usage.hasNonNull("prompt_tokens") ? usage.get("prompt_tokens").asInt() : null,
                    usage.hasNonNull("completion_tokens") ? usage.get("completion_tokens").asInt() : null,
                    usage.hasNonNull("total_tokens") ? usage.get("total_tokens").asInt() : null,
                    durationMs);
        } catch (ProviderUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Could not read the Groq response", ex);
            throw new ProviderUnavailableException("The AI assistant sent an answer we could not read.");
        }
    }
}

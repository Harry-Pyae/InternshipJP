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

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.net.http.HttpTimeoutException;
import java.time.Duration;
import java.util.List;

/**
 * Google Gemini, behind the same interface as Groq.
 *
 * WHY A SECOND PROVIDER EXISTS
 *   Developing from Myanmar, the two are mutually exclusive: Groq is blocked
 *   once a VPN is on, Gemini is blocked without one. So the project needs
 *   both implementations and a way to pick, even though only one can answer at
 *   a time on any given machine.
 *
 *   Gemini was also chosen for Burmese. Groq's models are weaker on
 *   low-resource languages, and Burmese is the case the language feature
 *   exists for.
 *
 * WHERE GEMINI DIFFERS FROM AN OPENAI-SHAPED API
 *   Groq speaks the OpenAI dialect: one "messages" array with a role on each
 *   entry, including "system". Gemini does not.
 *
 *     - the system prompt is a separate top-level "systemInstruction", not a
 *       message. Sending it as a message makes the model treat it as something
 *       the user said, and it stops behaving like an instruction.
 *     - roles are "user" and "model", not "user" and "assistant"
 *     - message text sits in parts[], not in a plain string
 *     - the model name lives in the URL path, not in the body
 *     - the key is a query parameter, not a bearer token
 *
 *   Translating between the two shapes is this class's whole job. Nothing
 *   above it changes.
 */
@Component
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "gemini")
public class GeminiClient implements AiProviderClient {

    private static final Logger log = LoggerFactory.getLogger(GeminiClient.class);
    private static final String PROVIDER = "gemini";

    private final AppProperties appProperties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public GeminiClient(AppProperties appProperties, ObjectMapper objectMapper) {
        this.appProperties = appProperties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
        log.info("AI provider: gemini (model {})", gemini().getModel());
    }

    private AppProperties.Gemini gemini() {
        return appProperties.getAi().getGemini();
    }

    @Override
    public String providerName() {
        return PROVIDER;
    }

    @Override
    public boolean isConfigured() {
        return StringUtils.hasText(gemini().getApiKey());
    }

    @Override
    public AiProviderStatus checkStatus() {
        if (!isConfigured()) {
            return new AiProviderStatus(PROVIDER, false, false, gemini().getModel(), null,
                    "No API key configured. Set GEMINI_API_KEY in application-local.properties.");
        }

        long startedAt = System.currentTimeMillis();
        try {
            // A GET that lists models: cheap, and it proves the key and the
            // network without spending a generation on a health check.
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(gemini().getBaseUrl() + "/models?key=" + gemini().getApiKey()))
                    .timeout(Duration.ofSeconds(gemini().getTimeoutSeconds()))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            long latency = System.currentTimeMillis() - startedAt;

            if (response.statusCode() / 100 == 2) {
                return new AiProviderStatus(PROVIDER, true, true, gemini().getModel(), latency, null);
            }
            return new AiProviderStatus(PROVIDER, true, false, gemini().getModel(), latency,
                    "The provider answered with HTTP " + response.statusCode() + ": "
                            + readErrorMessage(response.body()));
        } catch (Exception ex) {
            long latency = System.currentTimeMillis() - startedAt;
            log.warn("Gemini status check failed: {}", ex.getClass().getSimpleName());
            return new AiProviderStatus(PROVIDER, true, false, gemini().getModel(), latency,
                    "Could not reach the provider (" + ex.getClass().getSimpleName()
                            + "). If this machine needs a VPN for Gemini, check it is on.");
        }
    }

    @Override
    public AiCompletion complete(List<AiChatMessage> messages) {
        if (!isConfigured()) {
            throw new ProviderUnavailableException(
                    "The AI assistant is not configured on this server yet.");
        }

        boolean useThinkingConfig = gemini().getThinkingBudget() >= 0;
        try {
            return send(messages, useThinkingConfig);
        } catch (ProviderUnavailableException ex) {
            // A model that rejects thinkingConfig rejects the entire request.
            // Rather than showing the user a 400, drop the field and ask once
            // more - the answer is the same, it just costs a little of the
            // budget on reasoning.
            if (useThinkingConfig && ex.getMessage() != null
                    && ex.getMessage().contains("HTTP 400")) {
                log.warn("Gemini rejected thinkingConfig; retrying without it. "
                        + "Set GEMINI_THINKING_BUDGET=-1 to skip this retry.");
                return send(messages, false);
            }
            throw ex;
        }
    }

    private AiCompletion send(List<AiChatMessage> messages, boolean includeThinkingConfig) {
        String body = buildRequestBody(messages, includeThinkingConfig);
        // The model goes in the path and the key in the query string. Built
        // with a formatter rather than concatenation because the ":" before
        // generateContent is easy to mangle.
        String url = String.format("%s/models/%s:generateContent?key=%s",
                gemini().getBaseUrl(), gemini().getModel(), gemini().getApiKey());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(gemini().getTimeoutSeconds()))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        long started = System.currentTimeMillis();
        HttpResponse<String> response;
        try {
            response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (HttpTimeoutException ex) {
            throw new ProviderUnavailableException(
                    "The AI assistant took too long to answer. Please try again.");
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
            throw new ProviderUnavailableException("The AI request was interrupted.");
        } catch (IOException ex) {
            // The usual cause here is the network, not the service - a VPN that
            // dropped, or no VPN when one is required. Say so rather than
            // blaming the provider.
            throw new ProviderUnavailableException(
                    "Could not reach the AI provider. Check the server's internet connection.");
        }

        if (response.statusCode() / 100 != 2) {
            String reason = readErrorMessage(response.body());
            log.warn("Gemini returned HTTP {}: {}", response.statusCode(), reason);

            if (response.statusCode() == 400 && reason.toLowerCase().contains("api key")) {
                throw new ProviderUnavailableException(
                        "The AI provider rejected the server's credentials. Check GEMINI_API_KEY.");
            }
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                throw new ProviderUnavailableException(
                        "The AI provider rejected the server's credentials. Check GEMINI_API_KEY. ("
                                + reason + ")");
            }
            // Google rejects the request outright when the caller's IP is in an
            // unsupported country. It arrives as a 400 like any other bad
            // argument, so without this it reads as a code problem when it is
            // purely a network one - and it has nothing to do with which page
            // asked, since every role goes through this same client.
            if (reason.toLowerCase().contains("location is not supported")
                    || reason.toLowerCase().contains("user location")) {
                throw new ProviderUnavailableException(
                        "The AI provider does not accept requests from this server's location. "
                                + "This is the VPN: turn it on, or check it has not dropped. "
                                + "Nothing about the application changed.");
            }
            if (response.statusCode() == 404) {
                throw new ProviderUnavailableException(
                        "The configured model was not found. Check GEMINI_MODEL against the models "
                                + "your key can use. (" + reason + ")");
            }
            if (response.statusCode() == 429) {
                throw new ProviderUnavailableException(
                        "The AI assistant has hit its rate limit. Wait a minute and try again. ("
                                + reason + ")");
            }
            throw new ProviderUnavailableException(
                    "The AI assistant could not answer (HTTP " + response.statusCode()
                            + "): " + reason);
        }

        return parseCompletion(response.body(), System.currentTimeMillis() - started);
    }

    /** Translates our message list into Gemini's request shape. */
    private String buildRequestBody(List<AiChatMessage> messages, boolean includeThinkingConfig) {
        ObjectNode root = objectMapper.createObjectNode();
        ArrayNode contents = root.putArray("contents");

        StringBuilder systemText = new StringBuilder();
        for (AiChatMessage message : messages) {
            if ("system".equals(message.getRole())) {
                // Collected, not appended to the conversation. Gemini takes the
                // instruction separately; sent as a message it reads as
                // something the user typed and stops governing the answer.
                if (systemText.length() > 0) {
                    systemText.append("\n\n");
                }
                systemText.append(message.getContent());
                continue;
            }
            ObjectNode entry = contents.addObject();
            entry.put("role", "assistant".equals(message.getRole()) ? "model" : "user");
            entry.putArray("parts").addObject().put("text", message.getContent());
        }

        if (systemText.length() > 0) {
            root.putObject("systemInstruction")
                    .putArray("parts").addObject().put("text", systemText.toString());
        }

        ObjectNode generationConfig = root.putObject("generationConfig");
        generationConfig.put("maxOutputTokens", gemini().getMaxOutputTokens());
        generationConfig.put("temperature", 0.4);

        // Gemini 2.5+ models reason before answering and charge those tokens
        // against maxOutputTokens, so capping the reasoning leaves more of the
        // budget for the reply.
        //
        // But support for this field varies by model, and a model that does
        // not accept it rejects the WHOLE request with HTTP 400 rather than
        // ignoring the field. gemini-3.6-flash does exactly that. So it is
        // omitted unless asked for, and complete() retries without it if a
        // 400 comes back - see below.
        if (includeThinkingConfig && gemini().getThinkingBudget() >= 0) {
            generationConfig.putObject("thinkingConfig")
                    .put("thinkingBudget", gemini().getThinkingBudget());
        }

        try {
            return objectMapper.writeValueAsString(root);
        } catch (Exception ex) {
            throw new ProviderUnavailableException("Could not build the AI request.");
        }
    }

    private AiCompletion parseCompletion(String body, long durationMs) {
        try {
            JsonNode root = objectMapper.readTree(body);
            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                // Gemini returns no candidate when its safety filters block the
                // reply. The reason is worth surfacing rather than reporting an
                // empty answer.
                String blocked = root.path("promptFeedback").path("blockReason").asText("");
                throw new ProviderUnavailableException(StringUtils.hasText(blocked)
                        ? "The AI provider declined to answer this question (" + blocked + ")."
                        : "The AI assistant returned an empty answer.");
            }

            JsonNode candidate = candidates.get(0);

            // MAX_TOKENS means the answer was cut off, not finished. Without
            // this the reader sees a sentence stopping halfway with no way to
            // tell the model was interrupted rather than being unhelpful.
            String finishReason = candidate.path("finishReason").asText("");
            boolean truncated = "MAX_TOKENS".equals(finishReason);

            // Every call logs why it stopped and where the tokens went. Without
            // this, a short answer is indistinguishable from a truncated one -
            // and the two need opposite fixes.
            //
            // thoughtsTokenCount is the one that matters on 2.5+ models: the
            // reasoning step is charged against the SAME budget as the reply,
            // so a large number here explains a short answer even when the
            // limit was never formally reached.
            JsonNode usageNode = root.path("usageMetadata");
            log.info("Gemini finishReason={} prompt={} answer={} thoughts={} total={} cap={}",
                    finishReason.isEmpty() ? "(none)" : finishReason,
                    usageNode.path("promptTokenCount").asInt(0),
                    usageNode.path("candidatesTokenCount").asInt(0),
                    usageNode.path("thoughtsTokenCount").asInt(0),
                    usageNode.path("totalTokenCount").asInt(0),
                    gemini().getMaxOutputTokens());

            if (truncated) {
                log.warn("Gemini hit maxOutputTokens ({}). Raise GEMINI_MAX_OUTPUT_TOKENS.",
                        gemini().getMaxOutputTokens());
            }

            JsonNode parts = candidate.path("content").path("parts");
            StringBuilder text = new StringBuilder();
            for (JsonNode part : parts) {
                text.append(part.path("text").asText(""));
            }
            if (text.length() == 0) {
                throw new ProviderUnavailableException("The AI assistant returned an empty answer.");
            }

            String answer = text.toString().strip();

            // The subtler case: the model stopped without saying MAX_TOKENS,
            // yet reply plus reasoning consumed nearly the whole allowance. It
            // looks like a complete answer and is not, so it is reported too.
            int spent = usageNode.path("candidatesTokenCount").asInt(0)
                    + usageNode.path("thoughtsTokenCount").asInt(0);
            boolean nearlyFull = !truncated && spent > 0
                    && spent >= (int) (gemini().getMaxOutputTokens() * 0.9);
            if (nearlyFull) {
                log.warn("Gemini stopped with finishReason={} after {} of {} tokens "
                        + "({} of them reasoning). The answer is probably incomplete.",
                        finishReason, spent, gemini().getMaxOutputTokens(),
                        usageNode.path("thoughtsTokenCount").asInt(0));
                answer += "\n\n[This answer used almost the whole length allowance and may be "
                        + "incomplete. Ask a narrower question, or raise GEMINI_MAX_OUTPUT_TOKENS.]";
            }

            if (truncated) {
                answer += "\n\n[This answer reached the length limit and was cut off. "
                        + "Ask a narrower question, or raise GEMINI_MAX_OUTPUT_TOKENS.]";
            }
            // Gemini reports totalTokenCount directly; Groq's client sums the
            // two. Either way the usage log stores the same three numbers.
            return new AiCompletion(
                    answer,
                    gemini().getModel(),
                    usageNode.path("promptTokenCount").asInt(0),
                    usageNode.path("candidatesTokenCount").asInt(0),
                    usageNode.path("totalTokenCount").asInt(0),
                    durationMs);
        } catch (ProviderUnavailableException ex) {
            throw ex;
        } catch (Exception ex) {
            log.warn("Could not read the Gemini response", ex);
            throw new ProviderUnavailableException("The AI assistant sent an answer we could not read.");
        }
    }

    /**
     * Google puts the real reason in { "error": { "message": ... } }. It
     * describes the request, never the key, so it is safe to show.
     */
    private String readErrorMessage(String body) {
        if (!StringUtils.hasText(body)) {
            return "no detail returned";
        }
        try {
            JsonNode error = objectMapper.readTree(body).path("error");
            String message = error.path("message").asText("");

            // "Request contains an invalid argument" on its own says nothing.
            // Google names the offending field in error.details, which is the
            // part worth reading.
            JsonNode details = error.path("details");
            if (details.isArray()) {
                for (JsonNode detail : details) {
                    JsonNode violations = detail.path("fieldViolations");
                    for (JsonNode violation : violations) {
                        String field = violation.path("field").asText("");
                        String because = violation.path("description").asText("");
                        if (StringUtils.hasText(field) || StringUtils.hasText(because)) {
                            message += " [" + field + " " + because + "]";
                        }
                    }
                }
            }

            if (!StringUtils.hasText(message)) {
                message = body;
            }
            return message.length() > 200 ? message.substring(0, 197) + "..." : message;
        } catch (Exception ex) {
            String trimmed = body.strip();
            return trimmed.length() > 200 ? trimmed.substring(0, 197) + "..." : trimmed;
        }
    }
}

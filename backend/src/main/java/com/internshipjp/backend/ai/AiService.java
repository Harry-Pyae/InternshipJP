package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.request.AiChatRequest;
import com.internshipjp.backend.dto.response.AiChatResponse;
import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.dto.response.AiStatusResponse;
import com.internshipjp.backend.entity.AiConversation;
import com.internshipjp.backend.entity.AiConversationType;
import com.internshipjp.backend.entity.AiMessageRole;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.exception.ProviderUnavailableException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * The AI feature the rest of the application talks to.
 *
 * FLOW FOR ONE QUESTION
 *   1. build the context from live data the signed-in user is allowed to see
 *   2. if there is not enough real data, answer honestly and stop
 *   3. send system prompt + context + recent turns + the question
 *   4. store the question and the answer
 *   5. log the call (provider, model, tokens, timing, success) for oversight
 *
 * DEGRADING INSTEAD OF FAILING
 *   If Groq is not configured or not reachable, the user still gets a
 *   response object with degraded=true and a readable explanation. The chat
 *   page stays usable and nobody sees a stack trace.
 */
@Service
public class AiService {

    /** How many previous messages are replayed so the thread has memory. */
    private static final int HISTORY_TURNS = 6;

    private final AiProviderClient providerClient;
    private final AiPromptService promptService;
    private final AiConversationService conversationService;
    private final StudentRecommendationService studentRecommendationService;
    private final CandidateComparisonService candidateComparisonService;
    private final AiUsageRecorder usageRecorder;

    public AiService(AiProviderClient providerClient,
                     AiPromptService promptService,
                     AiConversationService conversationService,
                     StudentRecommendationService studentRecommendationService,
                     CandidateComparisonService candidateComparisonService,
                     AiUsageRecorder usageRecorder) {
        this.providerClient = providerClient;
        this.promptService = promptService;
        this.conversationService = conversationService;
        this.studentRecommendationService = studentRecommendationService;
        this.candidateComparisonService = candidateComparisonService;
        this.usageRecorder = usageRecorder;
    }

    public AiStatusResponse status() {
        AiProviderStatus status = providerClient.checkStatus();

        AiStatusResponse response = new AiStatusResponse();
        response.setProvider(status.getProvider());
        response.setConfigured(status.isConfigured());
        response.setReachable(status.isReachable());
        response.setModel(status.getModel());
        response.setLatencyMs(status.getLatencyMs());
        response.setError(status.getError());

        usageRecorder.recordStatusCheck(status.getProvider(), status.isConfigured(),
                status.isReachable(), status.getModel(), status.getLatencyMs());
        return response;
    }

    /** Career guidance for the signed-in student. */
    public AiChatResponse studentChat(User user, AiChatRequest request) {
        Optional<String> context = studentRecommendationService.buildContext(user.getId());
        if (context.isEmpty()) {
            return degraded(user, request, AiConversationType.STUDENT_GUIDANCE, null,
                    "Your profile does not have enough information yet. Add your field of "
                            + "study and a few skills on the profile page, then ask me again.");
        }
        return chat(user, request, AiConversationType.STUDENT_GUIDANCE, null,
                promptService.studentSystemPrompt(), context.get(), "STUDENT_CHAT");
    }

    /** Candidate comparison for one of the employer's own internships. */
    public AiChatResponse employerChat(User user, AiChatRequest request) {
        if (request.getInternshipId() == null) {
            throw new BadRequestException(
                    "Choose which internship you want to discuss before asking a question.");
        }
        Optional<String> context =
                candidateComparisonService.buildContext(user.getId(), request.getInternshipId());
        if (context.isEmpty()) {
            return degraded(user, request, AiConversationType.EMPLOYER_COMPARISON,
                    request.getInternshipId(),
                    "Nobody has applied to this internship yet, so there are no candidates "
                            + "to compare. Ask me again once you have applicants.");
        }
        return chat(user, request, AiConversationType.EMPLOYER_COMPARISON, request.getInternshipId(),
                promptService.employerSystemPrompt(), context.get(), "EMPLOYER_CHAT");
    }

    public List<AiConversationResponse> conversations(Long userId) {
        return conversationService.listConversations(userId);
    }

    public List<AiMessageResponse> messages(Long userId, Long conversationId) {
        return conversationService.listMessages(userId, conversationId);
    }

    // ---------------------------------------------------------------- internal

    private AiChatResponse chat(User user, AiChatRequest request, AiConversationType type,
                                Long contextReferenceId, String systemPrompt, String context,
                                String feature) {
        AiConversation conversation = conversationService.resolveConversation(
                user, request.getConversationId(), type, contextReferenceId, request.getMessage());

        conversationService.addMessage(conversation, AiMessageRole.USER, request.getMessage());

        List<AiChatMessage> messages = new ArrayList<>();
        messages.add(AiChatMessage.system(systemPrompt));
        messages.add(AiChatMessage.system(context));
        messages.addAll(conversationService.recentTurns(conversation.getId(), HISTORY_TURNS));

        try {
            AiCompletion completion = providerClient.complete(messages);
            conversationService.addMessage(conversation, AiMessageRole.ASSISTANT, completion.getContent());
            usageRecorder.recordSuccess(user.getId(), feature,
                    providerClient.providerName(), completion);

            AiChatResponse response = new AiChatResponse();
            response.setConversationId(conversation.getId());
            response.setAnswer(completion.getContent());
            response.setModel(completion.getModel());
            response.setDegraded(false);
            response.setCreatedAt(LocalDateTime.now().toString());
            return response;

        } catch (ProviderUnavailableException ex) {
            usageRecorder.recordFailure(user.getId(), feature,
                    providerClient.providerName(), "PROVIDER_UNAVAILABLE", null, null);

            String explanation = ex.getMessage();
            conversationService.addMessage(conversation, AiMessageRole.ASSISTANT, explanation);

            AiChatResponse response = new AiChatResponse();
            response.setConversationId(conversation.getId());
            response.setAnswer(explanation);
            response.setDegraded(true);
            response.setCreatedAt(LocalDateTime.now().toString());
            return response;
        }
    }

    /** Honest "not enough data yet" answer. No provider call, no invented data. */
    private AiChatResponse degraded(User user, AiChatRequest request, AiConversationType type,
                                    Long contextReferenceId, String explanation) {
        AiConversation conversation = conversationService.resolveConversation(
                user, request.getConversationId(), type, contextReferenceId, request.getMessage());
        conversationService.addMessage(conversation, AiMessageRole.USER, request.getMessage());
        conversationService.addMessage(conversation, AiMessageRole.ASSISTANT, explanation);

        AiChatResponse response = new AiChatResponse();
        response.setConversationId(conversation.getId());
        response.setAnswer(explanation);
        response.setDegraded(true);
        response.setCreatedAt(LocalDateTime.now().toString());
        return response;
    }

}

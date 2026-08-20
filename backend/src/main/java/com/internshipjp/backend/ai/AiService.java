package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.request.AiChatRequest;
import com.internshipjp.backend.dto.response.AiChatResponse;
import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.dto.response.AiStatusResponse;
import com.internshipjp.backend.dto.response.AdminWorkloadResponse;
import com.internshipjp.backend.dto.response.CompanyInsightResponse;
import com.internshipjp.backend.dto.response.InternshipMatchResponse;
import com.internshipjp.backend.dto.response.SkillGapResponse;
import com.internshipjp.backend.entity.AiConversation;
import com.internshipjp.backend.entity.AiConversationType;
import com.internshipjp.backend.entity.AiMessageRole;
import com.internshipjp.backend.entity.User;
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

    /**
     * How many previous messages are replayed so the thread has memory.
     *
     * Four, not six. Every replayed message is sent again on every question,
     * so the request grows with the conversation - and a free-tier
     * tokens-per-minute allowance is measured per request. Six full-length
     * answers plus the context block was enough to be refused outright after
     * three or four questions.
     */
    private static final int HISTORY_TURNS = 4;

    private final AiProviderClient providerClient;
    private final AiPromptService promptService;
    private final AiConversationService conversationService;
    private final StudentRecommendationService studentRecommendationService;
    private final CandidateComparisonService candidateComparisonService;
    private final AiRecommendationService recommendationService;
    private final StudentSkillGapService skillGapService;
    private final CompanyInsightService companyInsightService;
    private final AdminWorkloadService adminWorkloadService;
    private final AiUsageRecorder usageRecorder;

    public AiService(AiProviderClient providerClient,
                     AiPromptService promptService,
                     AiConversationService conversationService,
                     StudentRecommendationService studentRecommendationService,
                     CandidateComparisonService candidateComparisonService,
                     AiRecommendationService recommendationService,
                     StudentSkillGapService skillGapService,
                     CompanyInsightService companyInsightService,
                     AdminWorkloadService adminWorkloadService,
                     AiUsageRecorder usageRecorder) {
        this.providerClient = providerClient;
        this.promptService = promptService;
        this.conversationService = conversationService;
        this.studentRecommendationService = studentRecommendationService;
        this.candidateComparisonService = candidateComparisonService;
        this.recommendationService = recommendationService;
        this.skillGapService = skillGapService;
        this.companyInsightService = companyInsightService;
        this.adminWorkloadService = adminWorkloadService;
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

    /**
     * Career guidance for the signed-in student.
     *
     * The context is two calculated blocks joined together: their profile with
     * scored internship matches, and the skill gap analysis. Both are counted
     * from the database, so the model is reasoning about real demand rather
     * than guessing what is popular.
     */
    public AiChatResponse studentChat(User user, AiChatRequest request) {
        Optional<String> profileContext = studentRecommendationService.buildContext(user.getId());
        if (profileContext.isEmpty()) {
            return degraded(user, request, AiConversationType.STUDENT_GUIDANCE, null,
                    "Your profile does not have enough information yet. Add your field of "
                            + "study and a few skills on the profile page, then ask me again - "
                            + "I need something to compare against the open internships.");
        }

        SkillGapResponse gaps = skillGapService.analyse(user.getId());
        String context = profileContext.get() + skillGapService.buildGapContext(gaps);

        return chat(user, request, AiConversationType.STUDENT_GUIDANCE, null,
                promptService.studentSystemPrompt(), context, "STUDENT_CHAT");
    }

    /**
     * The employer assistant, which has two genuinely different jobs.
     *
     *   internshipId present -> CANDIDATE MODE: read the applicants of that one
     *                           vacancy against what it asked for
     *   internshipId absent  -> COMPANY MODE: review the company's own listings,
     *                           pipeline and requirements - "what are we missing
     *                           as an employer?"
     *
     * The two use different prompts and different context, because "who is the
     * strongest applicant?" and "why is nobody applying?" are not the same
     * question and must not get the same generic answer.
     */
    public AiChatResponse employerChat(User user, AiChatRequest request) {
        if (request.getInternshipId() != null) {
            return employerCandidateChat(user, request);
        }
        return employerCompanyChat(user, request);
    }

    private AiChatResponse employerCandidateChat(User user, AiChatRequest request) {
        Optional<String> context =
                candidateComparisonService.buildContext(user.getId(), request.getInternshipId());
        if (context.isEmpty()) {
            return degraded(user, request, AiConversationType.EMPLOYER_COMPARISON,
                    request.getInternshipId(),
                    "Nobody has applied to this internship yet, so there are no candidates to "
                            + "compare. Ask without choosing an internship and I will review your "
                            + "listings instead - that is usually why applications are not arriving.");
        }
        return chat(user, request, AiConversationType.EMPLOYER_COMPARISON, request.getInternshipId(),
                promptService.employerCandidatePrompt(), context.get(), "EMPLOYER_CANDIDATE_CHAT");
    }

    private AiChatResponse employerCompanyChat(User user, AiChatRequest request) {
        CompanyInsightResponse insight = companyInsightService.analyse(user.getId());
        if (insight.getTotalInternships() == 0) {
            return degraded(user, request, AiConversationType.EMPLOYER_COMPANY_REVIEW, null,
                    "You have not created any internships yet, so there is nothing to review. "
                            + "Create one with a clear description and a list of required skills - "
                            + "the required skills are what students are matched against.");
        }
        String context = companyInsightService.buildInsightContext(insight);
        return chat(user, request, AiConversationType.EMPLOYER_COMPANY_REVIEW, null,
                promptService.employerCompanyPrompt(), context, "EMPLOYER_COMPANY_CHAT");
    }

    /**
     * Triage for an administrator: what is waiting, and what has waited too
     * long. Unlike the other two, this one always has context - an empty queue
     * is a real and useful answer.
     */
    public AiChatResponse adminChat(User user, AiChatRequest request) {
        AdminWorkloadResponse workload = adminWorkloadService.analyse();
        String context = adminWorkloadService.buildWorkloadContext(workload);
        return chat(user, request, AiConversationType.ADMIN_REVIEW, null,
                promptService.adminPrompt(), context, "ADMIN_CHAT");
    }

    /** The calculated report on its own. No provider call. */
    public AdminWorkloadResponse adminWorkload() {
        return adminWorkloadService.analyse();
    }

    public List<AiConversationResponse> conversations(Long userId) {
        return conversationService.listConversations(userId);
    }

    public List<AiMessageResponse> messages(Long userId, Long conversationId) {
        return conversationService.listMessages(userId, conversationId);
    }

    public void deleteConversation(Long userId, Long conversationId) {
        conversationService.deleteConversation(userId, conversationId);
    }

    /**
     * Internship recommendations calculated in Java, with no provider call.
     * Works whether or not an API key is configured.
     */
    public List<InternshipMatchResponse> recommendations(Long userId, int limit) {
        return recommendationService.recommend(userId, limit);
    }

    /** Skill gap analysis for a student. Calculated, no provider call. */
    public SkillGapResponse skillGaps(Long userId) {
        return skillGapService.analyse(userId);
    }

    /** Listing and pipeline review for an employer. Calculated, no provider call. */
    public CompanyInsightResponse companyInsights(Long userId) {
        return companyInsightService.analyse(userId);
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

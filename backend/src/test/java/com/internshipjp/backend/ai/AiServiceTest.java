package com.internshipjp.backend.ai;

import com.internshipjp.backend.dto.request.AiChatRequest;
import com.internshipjp.backend.dto.response.AiChatResponse;
import com.internshipjp.backend.dto.response.CompanyInsightResponse;
import com.internshipjp.backend.dto.response.SkillGapResponse;
import com.internshipjp.backend.entity.AccountStatus;
import com.internshipjp.backend.entity.AiConversation;
import com.internshipjp.backend.entity.AiConversationType;
import com.internshipjp.backend.entity.AiMessageRole;
import com.internshipjp.backend.entity.Role;
import com.internshipjp.backend.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * How the assistant behaves when things are not perfect.
 *
 * The happy path is the easy case. These tests cover the three situations that
 * actually decide whether the feature is usable in a demo:
 *   - the student has not filled in their profile
 *   - the provider is unreachable or has no key
 *   - private data must not leak into the prompt
 *
 * No network, no API key, no database - the provider is FakeAiProviderClient.
 *
 * Owner: Member 1.
 */
class AiServiceTest {

    private FakeAiProviderClient provider;
    private AiConversationService conversationService;
    private StudentRecommendationService recommendationContext;
    private CandidateComparisonService comparisonContext;
    private StudentSkillGapService skillGapService;
    private CompanyInsightService companyInsightService;
    private AiUsageRecorder usageRecorder;
    private User student;
    private AiConversation conversation;

    @BeforeEach
    void setUp() {
        conversationService = Mockito.mock(AiConversationService.class);
        recommendationContext = Mockito.mock(StudentRecommendationService.class);
        comparisonContext = Mockito.mock(CandidateComparisonService.class);
        skillGapService = Mockito.mock(StudentSkillGapService.class);
        companyInsightService = Mockito.mock(CompanyInsightService.class);
        usageRecorder = Mockito.mock(AiUsageRecorder.class);

        // The student chat always appends the calculated gap analysis.
        Mockito.when(skillGapService.analyse(Mockito.anyLong()))
                .thenReturn(new SkillGapResponse());
        Mockito.when(skillGapService.buildGapContext(Mockito.any()))
                .thenReturn("\nSKILL GAP ANALYSIS\nMost requested skill missing: React\n");

        student = new User();
        student.setId(7L);
        student.setEmail("student@test.local");
        student.setFullName("Test Student");
        student.setPasswordHash("$2a$10$averysecrethashthatmustnotleak");
        student.setRole(Role.STUDENT);
        student.setAccountStatus(AccountStatus.ACTIVE);

        conversation = new AiConversation();
        conversation.setId(42L);
        conversation.setOwner(student);
        conversation.setConversationType(AiConversationType.STUDENT_GUIDANCE);

        Mockito.when(conversationService.resolveConversation(
                        Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any(), Mockito.any()))
                .thenReturn(conversation);
        Mockito.when(conversationService.recentTurns(Mockito.anyLong(), Mockito.anyInt()))
                .thenReturn(List.of());
    }

    private AiService serviceWith(FakeAiProviderClient fake) {
        provider = fake;
        return new AiService(fake, new AiPromptService(), conversationService,
                recommendationContext, comparisonContext,
                Mockito.mock(AiRecommendationService.class),
                skillGapService, companyInsightService, usageRecorder);
    }

    private User employer() {
        User employer = new User();
        employer.setId(8L);
        employer.setEmail("employer@test.local");
        employer.setFullName("Test Employer");
        employer.setRole(Role.EMPLOYER);
        employer.setAccountStatus(AccountStatus.ACTIVE);
        return employer;
    }

    private AiChatRequest ask(String message) {
        AiChatRequest request = new AiChatRequest();
        request.setMessage(message);
        return request;
    }

    @Test
    void answersHonestlyWhenTheProfileHasNoUsableData() {
        Mockito.when(recommendationContext.buildContext(7L)).thenReturn(Optional.empty());
        AiService service = serviceWith(FakeAiProviderClient.working());

        AiChatResponse response = service.studentChat(student, ask("What suits me?"));

        assertTrue(response.isDegraded());
        assertTrue(response.getAnswer().toLowerCase().contains("profile"),
                "the message should tell the student what to fix");
        // The provider must not be called at all - there is nothing to send.
        assertEquals(0, provider.getReceivedRequests().size());
    }

    @Test
    void degradesGracefullyWhenTheProviderIsUnavailable() {
        Mockito.when(recommendationContext.buildContext(7L))
                .thenReturn(Optional.of("CONTEXT\nSkills: Java, SQL"));
        AiService service = serviceWith(FakeAiProviderClient.unavailable());

        AiChatResponse response = service.studentChat(student, ask("What suits me?"));

        // A readable answer, not an exception: the chat page stays usable.
        assertTrue(response.isDegraded());
        assertFalse(response.getAnswer().isBlank());
        assertEquals(42L, response.getConversationId());
    }

    @Test
    void returnsTheProviderAnswerAndStoresBothSidesOfTheExchange() {
        Mockito.when(recommendationContext.buildContext(7L))
                .thenReturn(Optional.of("CONTEXT\nSkills: Java, SQL"));
        AiService service = serviceWith(FakeAiProviderClient.working());

        AiChatResponse response = service.studentChat(student, ask("What suits me?"));

        assertFalse(response.isDegraded());
        assertEquals("Here are three internships that fit your skills.", response.getAnswer());
        Mockito.verify(conversationService)
                .addMessage(conversation, AiMessageRole.USER, "What suits me?");
        Mockito.verify(conversationService)
                .addMessage(conversation, AiMessageRole.ASSISTANT, response.getAnswer());
    }

    @Test
    void sendsTheRulesAndTheContextButNeverAnythingSecret() {
        Mockito.when(recommendationContext.buildContext(7L))
                .thenReturn(Optional.of("CONTEXT\nStudent: Test Student\nSkills: Java, SQL"));
        AiService service = serviceWith(FakeAiProviderClient.working());

        service.studentChat(student, ask("What suits me?"));
        String sent = provider.lastPromptAsText().toLowerCase();

        assertTrue(sent.contains("skills: java, sql"), "the profile context should reach the provider");
        assertTrue(sent.contains("skill gap analysis"), "the gap analysis should reach the provider");
        assertTrue(sent.contains("never invent"), "the behaviour rules should reach the provider");
        assertTrue(sent.contains("careers adviser"), "the student prompt should be used");

        // The guard that matters: nothing from the security model may appear.
        assertFalse(sent.contains("$2a$10$"), "a password hash reached the AI provider");
        assertFalse(sent.contains("passwordhash"));
        assertFalse(sent.contains("totp"));
    }

    @Test
    void employerChatWithoutAnInternshipReviewsTheCompanyInstead() {
        AiService service = serviceWith(FakeAiProviderClient.working());
        User employer = employer();

        CompanyInsightResponse insight = new CompanyInsightResponse();
        insight.setTotalInternships(2);
        Mockito.when(companyInsightService.analyse(8L)).thenReturn(insight);
        Mockito.when(companyInsightService.buildInsightContext(insight))
                .thenReturn("CONTEXT\nCompany: Test Co\nOpen internships: 2\n");

        AiChatResponse response = service.employerChat(employer, ask("Why is nobody applying?"));

        assertFalse(response.isDegraded());
        // Company mode must not use the candidate prompt or the candidate context.
        String sent = provider.lastPromptAsText().toLowerCase();
        assertTrue(sent.contains("what their company is missing"),
                "company mode should use the company prompt");
        assertFalse(sent.contains("who applied to one of their internships"),
                "company mode must not use the candidate prompt");
        Mockito.verify(comparisonContext, Mockito.never())
                .buildContext(Mockito.anyLong(), Mockito.anyLong());
    }

    @Test
    void employerChatWithAnInternshipComparesCandidates() {
        AiService service = serviceWith(FakeAiProviderClient.working());
        User employer = employer();
        AiChatRequest request = ask("Who is strongest?");
        request.setInternshipId(3L);
        Mockito.when(comparisonContext.buildContext(8L, 3L))
                .thenReturn(Optional.of("CONTEXT\nCandidates: 2\n"));

        AiChatResponse response = service.employerChat(employer, request);

        assertFalse(response.isDegraded());
        String sent = provider.lastPromptAsText().toLowerCase();
        assertTrue(sent.contains("recruitment analyst"),
                "candidate mode should use the candidate prompt");
        // The company report must not leak into a candidate conversation.
        Mockito.verify(companyInsightService, Mockito.never()).analyse(Mockito.anyLong());
    }

    @Test
    void companyModeSaysSoWhenThereAreNoInternshipsYet() {
        AiService service = serviceWith(FakeAiProviderClient.working());
        CompanyInsightResponse empty = new CompanyInsightResponse();
        empty.setTotalInternships(0);
        Mockito.when(companyInsightService.analyse(8L)).thenReturn(empty);

        AiChatResponse response = service.employerChat(employer(), ask("How are we doing?"));

        assertTrue(response.isDegraded());
        assertTrue(response.getAnswer().toLowerCase().contains("not created any internships"));
        assertEquals(0, provider.getReceivedRequests().size());
    }

    @Test
    void employerChatSaysSoWhenNobodyHasApplied() {
        AiService service = serviceWith(FakeAiProviderClient.working());
        User employer = employer();
        AiChatRequest request = ask("Who is best?");
        request.setInternshipId(3L);
        Mockito.when(comparisonContext.buildContext(8L, 3L)).thenReturn(Optional.empty());

        AiChatResponse response = service.employerChat(employer, request);

        assertTrue(response.isDegraded());
        assertTrue(response.getAnswer().toLowerCase().contains("applied"));
        assertEquals(0, provider.getReceivedRequests().size());
    }

    @Test
    void statusReportsWhatTheProviderActuallySaid() {
        AiService service = serviceWith(FakeAiProviderClient.notConfigured());

        var status = service.status();

        assertFalse(status.isConfigured());
        assertFalse(status.isReachable());
        // Every check is recorded, so a flaky provider shows up in the log.
        Mockito.verify(usageRecorder).recordStatusCheck(
                Mockito.anyString(), Mockito.eq(false), Mockito.eq(false),
                Mockito.any(), Mockito.any());
    }
}

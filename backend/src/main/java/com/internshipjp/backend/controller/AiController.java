package com.internshipjp.backend.controller;

import com.internshipjp.backend.ai.AiService;
import com.internshipjp.backend.dto.request.AiChatRequest;
import com.internshipjp.backend.dto.response.AiChatResponse;
import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.dto.response.AdminWorkloadResponse;
import com.internshipjp.backend.dto.response.CompanyInsightResponse;
import com.internshipjp.backend.dto.response.InternshipMatchResponse;
import com.internshipjp.backend.dto.response.SkillGapResponse;
import com.internshipjp.backend.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * The AI assistant. This is Member 1's area.
 *
 * Two chats, because they see different data:
 *   student-chat  - the signed-in student's own profile and the open vacancies
 *   employer-chat - the applicants of ONE internship the employer owns
 *
 * The assistant never changes anything. These endpoints only read.
 *
 * A response with degraded=true means either the provider was unavailable or
 * there was not enough real data to answer. The answer field still contains a
 * readable explanation, so the chat page never has to show an error box.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final AiService aiService;
    private final CurrentUserService currentUserService;

    public AiController(AiService aiService, CurrentUserService currentUserService) {
        this.aiService = aiService;
        this.currentUserService = currentUserService;
    }

    @PostMapping("/student-chat")
    @PreAuthorize("hasRole('STUDENT')")
    public AiChatResponse studentChat(@Valid @RequestBody AiChatRequest request) {
        return aiService.studentChat(currentUserService.requireUser(), request);
    }

    @PostMapping("/employer-chat")
    @PreAuthorize("hasRole('EMPLOYER')")
    public AiChatResponse employerChat(@Valid @RequestBody AiChatRequest request) {
        return aiService.employerChat(currentUserService.requireUser(), request);
    }

    @PostMapping("/admin-chat")
    @PreAuthorize("hasRole('ADMIN')")
    public AiChatResponse adminChat(@Valid @RequestBody AiChatRequest request) {
        return aiService.adminChat(currentUserService.requireUser(), request);
    }

    /**
     * "What should I work on today?"
     *
     * The review queues with how long each item has been waiting, oldest
     * first. Calculated - no AI provider call, so it works with no API key.
     */
    @GetMapping("/admin-workload")
    @PreAuthorize("hasRole('ADMIN')")
    public AdminWorkloadResponse adminWorkload() {
        return aiService.adminWorkload();
    }

    @GetMapping("/conversations")
    public List<AiConversationResponse> conversations() {
        return aiService.conversations(currentUserService.requireUserId());
    }

    @GetMapping("/conversations/{id}/messages")
    public List<AiMessageResponse> messages(@PathVariable Long id) {
        return aiService.messages(currentUserService.requireUserId(), id);
    }

    /**
     * Deletes one of your own conversations. A user should always be able to
     * remove their own chat history.
     */
    @DeleteMapping("/conversations/{id}")
    public ApiMessageResponse deleteConversation(@PathVariable Long id) {
        aiService.deleteConversation(currentUserService.requireUserId(), id);
        return new ApiMessageResponse("Conversation deleted.");
    }

    /**
     * Internship recommendations with the reasoning attached.
     *
     * This endpoint makes NO call to the AI provider - the score is calculated
     * from the student's skills and the internship's requirements. It therefore
     * works with no API key, costs nothing, and returns the same answer every
     * time for the same data.
     */
    @GetMapping("/recommendations")
    @PreAuthorize("hasRole('STUDENT')")
    public List<InternshipMatchResponse> recommendations(
            @RequestParam(defaultValue = "5") int limit) {
        int safeLimit = Math.min(Math.max(limit, 1), 20);
        return aiService.recommendations(currentUserService.requireUserId(), safeLimit);
    }

    /**
     * "What should I learn, and what is missing from my profile?"
     *
     * Counted from the database: which skills the open internships ask for,
     * which of those this student has, and what an employer would find empty.
     * No AI provider call, so it works with no API key.
     */
    @GetMapping("/skill-gaps")
    @PreAuthorize("hasRole('STUDENT')")
    public SkillGapResponse skillGaps() {
        return aiService.skillGaps(currentUserService.requireUserId());
    }

    /**
     * "What are we missing as an employer?"
     *
     * Reviews this company's own listings, its applicant pipeline, and the
     * skills it requires against what students on the platform actually have.
     * It is about the company, never about individual applicants. No AI
     * provider call.
     */
    @GetMapping("/company-insights")
    @PreAuthorize("hasRole('EMPLOYER')")
    public CompanyInsightResponse companyInsights() {
        return aiService.companyInsights(currentUserService.requireUserId());
    }
}

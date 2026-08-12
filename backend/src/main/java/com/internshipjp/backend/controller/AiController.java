package com.internshipjp.backend.controller;

import com.internshipjp.backend.ai.AiService;
import com.internshipjp.backend.dto.request.AiChatRequest;
import com.internshipjp.backend.dto.response.AiChatResponse;
import com.internshipjp.backend.dto.response.AiConversationResponse;
import com.internshipjp.backend.dto.response.AiMessageResponse;
import com.internshipjp.backend.security.CurrentUserService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
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

    @GetMapping("/conversations")
    public List<AiConversationResponse> conversations() {
        return aiService.conversations(currentUserService.requireUserId());
    }

    @GetMapping("/conversations/{id}/messages")
    public List<AiMessageResponse> messages(@PathVariable Long id) {
        return aiService.messages(currentUserService.requireUserId(), id);
    }
}

package com.internshipjp.backend.controller;

import com.internshipjp.backend.dto.request.FeedbackRequest;
import com.internshipjp.backend.dto.response.ApiMessageResponse;
import com.internshipjp.backend.entity.User;
import com.internshipjp.backend.security.CurrentUserService;
import com.internshipjp.backend.service.NotificationService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Feedback from the FAQ page.
 *
 * Delivered as a notification to every administrator rather than stored in a
 * table of its own. That is a deliberate trade: it needs no schema change, and
 * administrators already have a page that shows notifications, so the feedback
 * is actually read rather than accumulating somewhere nobody visits.
 *
 * The cost is that it cannot be marked resolved or replied to. If feedback
 * becomes something the platform manages rather than just receives, it needs
 * its own table.
 */
@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {

    private final NotificationService notificationService;
    private final CurrentUserService currentUserService;

    public FeedbackController(NotificationService notificationService,
                              CurrentUserService currentUserService) {
        this.notificationService = notificationService;
        this.currentUserService = currentUserService;
    }

    @PostMapping
    public ApiMessageResponse send(@Valid @RequestBody FeedbackRequest request) {
        User sender = currentUserService.requireUser();

        // The sender's name and role are put in the message because the
        // notification itself only knows who is RECEIVING it.
        notificationService.notifyAdmins(
                "FEEDBACK",
                "Feedback from " + sender.getFullName(),
                // The attribution and the message on separate lines, with what
                // the person actually wrote in quotation marks - the same shape
                // as an employer's note on an application. Run together, "Aung
                // Kyaw (employer) wrote: I want more ai assistant" reads as one
                // sentence, and the reader has to find where the report stops
                // and the person's own words start.
                sender.getFullName() + " (" + sender.getRole().name().toLowerCase() + ") wrote:"
                        + "\n\u201c" + request.getMessage().trim() + "\u201d");

        return new ApiMessageResponse("Thank you. Your feedback was sent to the team.");
    }
}

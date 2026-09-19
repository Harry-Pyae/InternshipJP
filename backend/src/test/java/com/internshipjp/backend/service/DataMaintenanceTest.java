package com.internshipjp.backend.service;

import com.internshipjp.backend.dto.response.DataCompactionResponse;
import com.internshipjp.backend.exception.BadRequestException;
import com.internshipjp.backend.repository.AiConversationRepository;
import com.internshipjp.backend.repository.AiMessageRepository;
import com.internshipjp.backend.repository.AiUsageLogRepository;
import com.internshipjp.backend.repository.EmailOtpChallengeRepository;
import com.internshipjp.backend.repository.NotificationRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mockito;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Compaction: what it counts, what it deletes, and what it refuses.
 *
 * The rule worth proving is that the preview and the run agree. An
 * administrator is shown a number and then presses a button that cannot be
 * undone, so the two must come from the same place and mean the same thing.
 *
 * Only the repositories are mocked - the arithmetic, the cutoff and the bounds
 * are the service's own, which is the part that can be wrong.
 */
class DataMaintenanceTest {

    private EmailOtpChallengeRepository otpRepository;
    private AiUsageLogRepository usageRepository;
    private NotificationRepository notificationRepository;
    private AiConversationRepository conversationRepository;
    private AiMessageRepository messageRepository;

    private DataMaintenanceService service;

    @BeforeEach
    void setUp() {
        otpRepository = Mockito.mock(EmailOtpChallengeRepository.class);
        usageRepository = Mockito.mock(AiUsageLogRepository.class);
        notificationRepository = Mockito.mock(NotificationRepository.class);
        conversationRepository = Mockito.mock(AiConversationRepository.class);
        messageRepository = Mockito.mock(AiMessageRepository.class);

        service = new DataMaintenanceService(
                Mockito.mock(JdbcTemplate.class),
                otpRepository,
                usageRepository,
                notificationRepository,
                conversationRepository,
                messageRepository);
    }

    @Test
    void previewAddsUpTheCategoriesAndDeletesNothing() {
        Mockito.when(otpRepository.countSpent(Mockito.any())).thenReturn(4L);
        Mockito.when(usageRepository.countByCreatedAtBefore(Mockito.any())).thenReturn(30L);
        Mockito.when(notificationRepository.countByReadTrueAndCreatedAtBefore(Mockito.any()))
                .thenReturn(12L);
        Mockito.when(conversationRepository.countByUpdatedAtBefore(Mockito.any())).thenReturn(2L);
        Mockito.when(messageRepository.countInConversationsBefore(Mockito.any())).thenReturn(9L);

        DataCompactionResponse preview = service.preview(90);

        assertFalse(preview.isApplied());
        assertEquals(90, preview.getRetentionDays());
        assertEquals(4 + 30 + 12 + 2 + 9, preview.getTotalRows());

        // The whole point of a preview.
        Mockito.verify(otpRepository, Mockito.never()).deleteSpent(Mockito.any());
        Mockito.verify(usageRepository, Mockito.never()).deleteCreatedBefore(Mockito.any());
        Mockito.verify(notificationRepository, Mockito.never()).deleteReadBefore(Mockito.any());
        Mockito.verify(messageRepository, Mockito.never())
                .deleteInConversationsBefore(Mockito.any());
        Mockito.verify(conversationRepository, Mockito.never()).deleteUpdatedBefore(Mockito.any());
    }

    @Test
    void compactReportsWhatItRemovedAndClearsMessagesBeforeTheirThreads() {
        Mockito.when(otpRepository.deleteSpent(Mockito.any())).thenReturn(4);
        Mockito.when(usageRepository.deleteCreatedBefore(Mockito.any())).thenReturn(30);
        Mockito.when(notificationRepository.deleteReadBefore(Mockito.any())).thenReturn(12);
        Mockito.when(messageRepository.deleteInConversationsBefore(Mockito.any())).thenReturn(9);
        Mockito.when(conversationRepository.deleteUpdatedBefore(Mockito.any())).thenReturn(2);

        DataCompactionResponse result = service.compact(90);

        assertTrue(result.isApplied());
        assertEquals(4 + 30 + 12 + 2 + 9, result.getTotalRows());

        // Messages first. The other way round the rows are already gone by
        // cascade and the figure reported back would always be zero.
        InOrder order = Mockito.inOrder(messageRepository, conversationRepository);
        order.verify(messageRepository).deleteInConversationsBefore(Mockito.any());
        order.verify(conversationRepository).deleteUpdatedBefore(Mockito.any());
    }

    @Test
    void theCutoffIsTheRetentionWindowCountedBackFromNow() {
        ArgumentCaptor<LocalDateTime> cutoff = ArgumentCaptor.forClass(LocalDateTime.class);

        // Bracketed rather than compared against a single reading. The service
        // takes its own clock reading somewhere between these two, and any
        // check that assumes it took the same one as the test is a test that
        // passes until the machine is a microsecond slower.
        LocalDateTime before = LocalDateTime.now();
        service.preview(30);
        LocalDateTime after = LocalDateTime.now();

        Mockito.verify(usageRepository).countByCreatedAtBefore(cutoff.capture());
        LocalDateTime captured = cutoff.getValue();
        assertFalse(captured.isBefore(before.minusDays(30)));
        assertFalse(captured.isAfter(after.minusDays(30)));
    }

    @Test
    void spentSignInCodesAreJudgedAgainstNowRatherThanTheRetentionWindow() {
        // A code that has been used, or has expired, can never be redeemed
        // again whatever the window says - so it is counted against the
        // present moment, not against the cutoff.
        ArgumentCaptor<LocalDateTime> at = ArgumentCaptor.forClass(LocalDateTime.class);
        LocalDateTime before = LocalDateTime.now();

        service.preview(365);

        Mockito.verify(otpRepository).countSpent(at.capture());
        assertFalse(at.getValue().isBefore(before));
    }

    @Test
    void aWindowShorterThanAMonthIsRefused() {
        BadRequestException thrown =
                assertThrows(BadRequestException.class, () -> service.preview(7));
        assertTrue(thrown.getMessage().contains("30"));

        // And the refusal happens before anything is touched.
        Mockito.verifyNoInteractions(otpRepository, usageRepository, notificationRepository,
                conversationRepository, messageRepository);
    }

    @Test
    void anAbsurdWindowIsRefusedToo() {
        assertThrows(BadRequestException.class, () -> service.compact(100_000));
        Mockito.verifyNoInteractions(otpRepository, usageRepository, notificationRepository,
                conversationRepository, messageRepository);
    }
}

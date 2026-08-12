package com.internshipjp.backend.ai;

import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * The stage-1 match score is plain arithmetic, so it can be tested exactly.
 *
 * This matters for explainability: when a student asks "why 40%?", the answer
 * is "two of the five required skills are on your profile", and that answer is
 * verified here rather than assumed.
 */
class StudentMatchScoreTest {

    // The repositories are unused by matchScore, so nulls are fine here.
    private final StudentRecommendationService service =
            new StudentRecommendationService(null, null, null, null, null, null);

    @Test
    void scoresAPerfectMatchAsOneHundred() {
        assertEquals(100, service.matchScore(Set.of("java", "sql"), List.of("Java", "SQL")));
    }

    @Test
    void scoresTwoOfFiveAsForty() {
        assertEquals(40, service.matchScore(
                Set.of("java", "sql"),
                List.of("Java", "SQL", "React", "Docker", "Kubernetes")));
    }

    @Test
    void ignoresLetterCase() {
        assertEquals(100, service.matchScore(Set.of("javascript"), List.of("JavaScript")));
    }

    @Test
    void scoresNoOverlapAsZero() {
        assertEquals(0, service.matchScore(Set.of("php"), List.of("Java", "SQL")));
    }

    @Test
    void returnsZeroWhenTheInternshipListsNoSkills() {
        // No requirements means there is nothing to match, not a free 100%.
        assertEquals(0, service.matchScore(Set.of("java"), List.of()));
    }

    @Test
    void roundsToTheNearestWholePercent() {
        // 1 of 3 = 33.33 -> 33
        assertEquals(33, service.matchScore(Set.of("java"), List.of("Java", "SQL", "React")));
    }
}

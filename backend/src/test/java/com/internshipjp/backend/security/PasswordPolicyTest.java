package com.internshipjp.backend.security;

import com.internshipjp.backend.exception.BadRequestException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * The password rules: eight characters, all four character classes, and a
 * denylist that catches what the classes let through.
 *
 * The denylist tests matter most here. "Password1!" satisfies every
 * composition rule in the policy, which is exactly why the policy cannot rely
 * on composition rules alone.
 */
class PasswordPolicyTest {

    private final PasswordPolicy policy = new PasswordPolicy();

    private static final String EMAIL = "thida.aung@example.com";
    private static final String NAME = "Thida Aung";

    @Test
    void allFourClassesAtTheMinimumLengthIsAccepted() {
        assertDoesNotThrow(() -> policy.check("Str0ng!x", EMAIL, NAME));
    }

    @Test
    void sevenCharactersIsRefused() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("Str0ng!", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("8"));
    }

    @Test
    void aMissingUppercaseLetterIsNamed() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("str0ng!xy", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("uppercase"),
                "the message should say which class is missing");
    }

    @Test
    void aMissingLowercaseLetterIsNamed() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("STR0NG!XY", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("lowercase"));
    }

    @Test
    void aMissingDigitIsNamed() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("Strong!xy", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("digit"));
    }

    @Test
    void aMissingSymbolIsNamed() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("Str0ngxyz", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("symbol"));
    }

    /** Only what is missing, not a restatement of all four. */
    @Test
    void onlyTheMissingClassesAreListed() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("strongxy1", EMAIL, NAME));
        assertTrue(thrown.getMessage().contains("uppercase"));
        assertTrue(thrown.getMessage().contains("symbol"));
        assertTrue(thrown.getMessage().contains("digit") == false,
                "a digit is present, so it should not be asked for");
    }

    /** Any non-alphanumeric counts, so nothing is refused for an unlisted symbol. */
    @Test
    void anyNonAlphanumericCountsAsASymbol() {
        assertDoesNotThrow(() -> policy.check("Str0ng\u00a3x", EMAIL, NAME));
        assertDoesNotThrow(() -> policy.check("Str0ng~x", EMAIL, NAME));
    }

    /**
     * The case that justifies keeping the denylist: this satisfies every
     * composition rule and is among the first anybody would try.
     */
    @Test
    void aPasswordMeetingEveryClassRuleCanStillBeRefused() {
        assertThrows(BadRequestException.class,
                () -> policy.check("Password123!", EMAIL, NAME));
    }

    @Test
    void beyondSeventyTwoIsRefused() {
        assertThrows(BadRequestException.class,
                () -> policy.check("Aa1!" + "b".repeat(70), EMAIL, NAME));
    }

    @Test
    void aPasswordContainingTheOwnersEmailIsRefused() {
        BadRequestException thrown = assertThrows(BadRequestException.class,
                () -> policy.check("Thida.aung1!", EMAIL, NAME));
        assertTrue(thrown.getMessage().toLowerCase().contains("email"));
    }

    @Test
    void aPasswordContainingTheOwnersNameIsRefused() {
        assertThrows(BadRequestException.class,
                () -> policy.check("ThidaAung1!", EMAIL, NAME));
    }

    /** A short fragment is not a leak. Refusing it would be obstruction. */
    @Test
    void aShortCoincidentalFragmentIsAllowed() {
        assertDoesNotThrow(() -> policy.check("Anchor1!", "an@b.com", "An Bo"));
    }

    @Test
    void aBlankPasswordIsRefused() {
        assertThrows(BadRequestException.class, () -> policy.check("   ", EMAIL, NAME));
        assertThrows(BadRequestException.class, () -> policy.check(null, EMAIL, NAME));
    }

    /** The seeded demo password must satisfy the rule it is used to show. */
    @Test
    void theDemoPasswordIsAcceptable() {
        assertDoesNotThrow(() -> policy.check("Practice-77x",
                "student3@demo.internshipjp.local", "Thida Aung"));
    }
}

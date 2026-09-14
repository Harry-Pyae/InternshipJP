package com.internshipjp.backend.security;

import com.internshipjp.backend.exception.BadRequestException;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * What counts as an acceptable password.
 *
 * THE RULE
 *   At least 8 characters, and at least one of each: an uppercase letter, a
 *   lowercase letter, a digit, and a character that is none of those.
 *
 * WHY THE DENYLIST MATTERS MORE HERE, NOT LESS
 *   Composition rules are satisfied in the most predictable way available.
 *   "Password1!" meets every requirement above, and so does "Summer2026@".
 *   At eight characters the classes are cheap to satisfy and the search space
 *   grows less than it looks, so the checks that refuse the obvious choices -
 *   and refuse somebody's own name or address - are doing more of the work
 *   than the character classes are.
 *
 * WHY THE MESSAGES NAME THE PROBLEM
 *   "Password is not strong enough" tells somebody nothing they can act on.
 *   Each rejection here says which rule failed and what to do instead, and the
 *   composition message lists only the classes that are actually missing
 *   rather than restating all four.
 */
@Component
public class PasswordPolicy {

    public static final int MIN_LENGTH = 8;

    /**
     * An upper bound too: BCrypt silently ignores input beyond 72 bytes, so a
     * longer password is not the protection somebody thinks it is. Rejecting
     * it is more honest than truncating it quietly.
     */
    public static final int MAX_LENGTH = 72;

    /**
     * Passwords that satisfy every length rule and protect nothing.
     *
     * Deliberately short. A serious breach list belongs in a file or a service
     * and is future work; this catches the handful a student project actually
     * sees, and the platform's own name, which is the first thing people try.
     */
    private static final Set<String> ALWAYS_REFUSED = Set.of(
            "password", "passwordpassword", "password123", "password1234",
            "123456789012", "1234567890", "qwertyuiop", "qwerty123456",
            "internshipjp", "internship123", "administrator", "letmein12345",
            "iloveyou1234", "welcome12345", "abcd12345678", "aaaaaaaaaaaa");

    /**
     * Checks a password and throws if it is unacceptable.
     *
     * @param password what the person typed
     * @param email    their address, so a password containing it is refused
     * @param fullName their name, for the same reason
     */
    public void check(String password, String email, String fullName) {
        if (!StringUtils.hasText(password)) {
            throw new BadRequestException("Choose a password.");
        }

        String value = password.trim();

        if (value.length() < MIN_LENGTH) {
            throw new BadRequestException(
                    "Use at least " + MIN_LENGTH + " characters.");
        }

        if (value.length() > MAX_LENGTH) {
            throw new BadRequestException(
                    "Use at most " + MAX_LENGTH + " characters.");
        }

        // Names only what is missing. Repeating all four requirements at somebody
        // who has three of them is noise, and noise is how people end up
        // appending "1!" rather than reading.
        List<String> missing = new ArrayList<>();
        if (value.chars().noneMatch(Character::isUpperCase)) {
            missing.add("an uppercase letter");
        }
        if (value.chars().noneMatch(Character::isLowerCase)) {
            missing.add("a lowercase letter");
        }
        if (value.chars().noneMatch(Character::isDigit)) {
            missing.add("a digit");
        }
        if (value.chars().noneMatch(PasswordPolicy::isSymbol)) {
            missing.add("a symbol such as ! ? - or #");
        }
        if (!missing.isEmpty()) {
            throw new BadRequestException("Add " + String.join(", ", missing) + ".");
        }

        String lower = value.toLowerCase(Locale.ROOT);

        if (ALWAYS_REFUSED.contains(lower)) {
            throw new BadRequestException(
                    "That password is one of the first anybody would try. Choose "
                            + "something else.");
        }

        // A single repeated character reaches any length and protects nothing.
        if (lower.chars().distinct().count() < 4) {
            throw new BadRequestException(
                    "That password repeats too few characters. Use a longer phrase.");
        }

        if (containsPart(lower, email)) {
            throw new BadRequestException(
                    "Your password contains your email address. Anybody who knows the "
                            + "address is most of the way there.");
        }

        if (containsPart(lower, fullName)) {
            throw new BadRequestException(
                    "Your password contains your name. Choose something that is not on "
                            + "your own profile.");
        }
    }

    /**
     * True when the password contains a meaningful part of the given text.
     *
     * Split on the things that separate words in a name or an address, and
     * ignore fragments under four characters - refusing a password because it
     * happens to contain "an" would be obstruction rather than security.
     */
    private boolean containsPart(String lowerPassword, String source) {
        if (!StringUtils.hasText(source)) {
            return false;
        }
        List<String> parts = List.of(source.toLowerCase(Locale.ROOT).split("[@._\\-\\s+]+"));
        return parts.stream()
                .filter(part -> part.length() >= 4)
                .anyMatch(lowerPassword::contains);
    }

    /**
     * Anything that is not a letter, a digit or whitespace.
     *
     * Defined by exclusion rather than by listing permitted symbols, so a
     * password is never refused for containing a character somebody did not
     * think to allow.
     */
    private static boolean isSymbol(int codePoint) {
        return !Character.isLetterOrDigit(codePoint) && !Character.isWhitespace(codePoint);
    }
}

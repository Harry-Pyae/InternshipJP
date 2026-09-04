/**
 * Client-side validation for the auth forms.
 *
 * WHAT THIS IS FOR, AND WHAT IT IS NOT
 *   It is for telling someone their email is missing an "@" before they wait
 *   on a round trip. It is NOT a security boundary. Every rule here is also
 *   enforced by Bean Validation on the server, because anyone can skip the
 *   browser entirely - and the server's answer always wins.
 *
 *   The rules deliberately mirror the backend DTOs (@Email, @NotBlank,
 *   @Size(min = 8)). If you change one, change the other, or the form will
 *   accept something the API then rejects.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
  required: (label) => (value) =>
    value && value.trim() ? null : `${label} is required.`,

  email: () => (value) => {
    if (!value || !value.trim()) {
      return "Email is required.";
    }
    // Deliberately loose. Real address validity is only ever proven by
    // sending mail to it; a stricter pattern rejects valid addresses.
    return EMAIL.test(value.trim()) ? null : "Enter a valid email address.";
  },

  password: () => (value) => {
    if (!value) {
      return "Password is required.";
    }
    // Matches @Size(min = 8) on the backend DTOs.
    return value.length >= 8 ? null : "Password must be at least 8 characters.";
  },

  url: (label) => (value) => {
    if (!value || !value.trim()) {
      return null; // optional
    }
    const trimmed = value.trim();
    return /^https?:\/\/.+\..+/.test(trimmed)
      ? null
      : `${label} should start with http:// or https://`;
  },
};

/** Runs a rule map over a value map. Returns only the fields that failed. */
export function validate(values, ruleMap) {
  const errors = {};
  for (const [field, rule] of Object.entries(ruleMap)) {
    const message = rule(values[field]);
    if (message) {
      errors[field] = message;
    }
  }
  return errors;
}

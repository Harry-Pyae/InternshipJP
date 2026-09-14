/**
 * Client-side validation for the auth forms.
 * @Size(min = 8)). If you change one, change the other, or the form will
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

  /**
   * A Myanmar number, in the form it is dialled from abroad.
   *
   * Mirrors the @Pattern on the request objects. Optional: an empty field
   * passes, an ill-formed one does not.
   */
  phone: () => (value) => {
    if (!value) {
      return null;
    }
    if (!/^\+95[0-9]{7,10}$/.test(value.trim())) {
      return "Use a Myanmar number in the form +959XXXXXXXX.";
    }
    return null;
  },

  password: () => (value) => {
    if (!value) {
      return "Password is required.";
    }
    // Mirrors PasswordPolicy: 8 to 72 characters, and all four classes. The
    // rest of that policy - the obvious choices, your own name, your own
    // address - is checked on the server only, because it depends on the
    // account and the browser should not be told which addresses exist.
    if (value.length < 8) {
      return "Use at least 8 characters.";
    }
    // BCrypt ignores anything past 72 bytes, so a longer password is not the
    // protection it looks like.
    if (value.length > 72) {
      return "Use at most 72 characters.";
    }
    // Named individually, so somebody with three of the four is told which one
    // is missing rather than having all four restated at them.
    const missing = [];
    if (!/[A-Z]/.test(value)) missing.push("an uppercase letter");
    if (!/[a-z]/.test(value)) missing.push("a lowercase letter");
    if (!/[0-9]/.test(value)) missing.push("a digit");
    // Anything that is not a letter, a digit or a space. Defined by exclusion
    // so no password is refused for a symbol nobody thought to list.
    if (!/[^A-Za-z0-9\s]/.test(value)) missing.push("a symbol such as ! ? - or #");
    return missing.length ? `Add ${missing.join(", ")}.` : null;
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

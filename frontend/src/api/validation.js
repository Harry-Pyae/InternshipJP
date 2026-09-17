import { currentLanguage, translate } from "../config/languageContext.jsx";

/**
 * Client-side validation for the auth forms.
 *
 * The rules mirror the server's (PasswordPolicy, and the @Pattern and @Size
 * constraints on the request objects). If you change one, change the other, or
 * the form will accept what the server then refuses.
 *
 * Messages are composed in the interface language, because they are shown
 * as they are returned.
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
  required: (label) => (value) =>
    value && value.trim() ? null : translate("{label} is required.", { label: translate(label) }),

  email: () => (value) => {
    if (!value || !value.trim()) {
      return translate("Email is required.");
    }
    // Deliberately loose. Real address validity is only ever proven by
    // sending mail to it; a stricter pattern rejects valid addresses.
    return EMAIL.test(value.trim()) ? null : translate("Enter a valid email address.");
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
    // Mirrors the @Pattern on the request objects: the E.164 shape, not a
    // Myanmar code. Registration asks for a country, and enforcing +95 while
    // offering that choice would tell somebody their own number is wrong.
    if (!/^\+[1-9][0-9]{6,14}$/.test(value.trim())) {
      return translate("Start with + and the country code, for example +959795123456.");
    }
    return null;
  },

  password: () => (value) => {
    if (!value) {
      return translate("Password is required.");
    }
    // Mirrors PasswordPolicy: 8 to 72 characters, and all four classes. The
    // rest of that policy - the obvious choices, your own name, your own
    // address - is checked on the server only, because it depends on the
    // account and the browser should not be told which addresses exist.
    if (value.length < 8) {
      return translate("Use at least 8 characters.");
    }
    // BCrypt ignores anything past 72 bytes, so a longer password is not the
    // protection it looks like.
    if (value.length > 72) {
      return translate("Use at most 72 characters.");
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
    const separator = currentLanguage() === "my" ? "၊ " : ", ";
    return missing.length
      ? translate("Add {items}.", { items: missing.map((item) => translate(item)).join(separator) })
      : null;
  },

  url: (label) => (value) => {
    if (!value || !value.trim()) {
      return null; // optional
    }
    const trimmed = value.trim();
    return /^https?:\/\/.+\..+/.test(trimmed)
      ? null
      : translate("{label} should start with http:// or https://", { label: translate(label) });
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

import { useState } from "react";

/**
 * A labelled input with a leading icon, and a reveal button on passwords.
 *
 * THE PASSWORD TOGGLE IS NOT DECORATION
 *   People mistype passwords constantly, and a form that only says "email or
 *   password is incorrect" gives them no way to tell which. Letting someone
 *   check what they typed removes a whole category of failed sign-in - it is
 *   the single highest-value control on this page.
 *
 * The icon is aria-hidden: it repeats what the label already says, so a screen
 * reader announcing it twice would be noise.
 */
export default function AuthField({
  id,
  label,
  icon,
  type = "text",
  value,
  onChange,
  error,
  hint,
  optional,
  ...rest
}) {
  const [revealed, setRevealed] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword && revealed ? "text" : type;

  return (
    <div className="ijp-field">
      <label className="ijp-field-label" htmlFor={id}>
        {label}
        {optional ? <span className="ijp-muted fw-normal"> (optional)</span> : null}
      </label>

      <div className="ijp-field-wrap">
        {icon ? <i className={`bi ${icon} ijp-field-icon`} aria-hidden="true" /> : null}
        <input
          id={id}
          type={inputType}
          className={`form-control ijp-field-input${icon ? " ijp-field-input--icon" : ""}${
            isPassword ? " ijp-field-input--action" : ""
          }${error ? " is-invalid" : ""}`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            className="ijp-field-action"
            onClick={() => setRevealed((current) => !current)}
            aria-label={revealed ? "Hide password" : "Show password"}
            title={revealed ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            <i className={`bi ${revealed ? "bi-eye-slash" : "bi-eye"}`} aria-hidden="true" />
          </button>
        ) : null}
      </div>

      {error ? <p className="ijp-field-error">{error}</p> : null}
      {hint && !error ? <p className="ijp-field-hint">{hint}</p> : null}
    </div>
  );
}

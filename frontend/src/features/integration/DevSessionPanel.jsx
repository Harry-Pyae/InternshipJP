import { useCallback, useEffect, useState } from "react";
import { authApi } from "../../api/authApi.js";
import { describeApiError, ensureCsrfToken, fieldErrorsOf } from "../../api/axiosClient.js";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";

/**
 * Developer session tool - Member 1 (integration).
 */
export default function DevSessionPanel() {
  // Vite replaces this with a literal at build time, so the bundler drops the
  // whole component from a production build.
  if (!import.meta.env.DEV) {
    return null;
  }
  return <DevSessionPanelInner />;
}

const BLANK = {
  email: "",
  password: "",
  fullName: "",
  university: "",
  companyName: "",
};

function DevSessionPanelInner() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [mode, setMode] = useState("login");
  const [role, setRole] = useState("STUDENT");
  const [form, setForm] = useState(BLANK);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState(null);
  const [notice, setNotice] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setUser(await authApi.me());
    } catch {
      // 401 is the normal answer when nobody is signed in.
      setUser(null);
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setFieldErrors(null);
    setNotice(null);

    try {
      // The CSRF cookie must exist before any write request. App.jsx fetches
      // it at startup; doing it again here makes the panel work even if the
      // backend was restarted after the page loaded.
      await ensureCsrfToken();

      if (mode === "register") {
        if (role === "STUDENT") {
          await authApi.registerStudent({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            university: form.university || undefined,
          });
        } else {
          await authApi.registerEmployer({
            email: form.email,
            password: form.password,
            fullName: form.fullName,
            companyName: form.companyName,
          });
        }
        setNotice(
          role === "EMPLOYER"
            ? "Employer account created. It starts PENDING until an administrator approves the company."
            : "Account created. Signing you in...",
        );
      }

      await authApi.login({ email: form.email, password: form.password });
      await refresh();
      setForm((current) => ({ ...current, password: "" }));
    } catch (submitError) {
      setError(describeApiError(submitError));
      setFieldErrors(fieldErrorsOf(submitError));
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await authApi.logout();
      await refresh();
    } catch (logoutError) {
      setError(describeApiError(logoutError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ijp-card p-4">
      <div className="d-flex justify-content-between align-items-center mb-1">
        <h2 className="ijp-label mb-0">
          <i className="bi bi-person-badge me-2" aria-hidden="true" />
          Session
        </h2>
        <span className="badge text-bg-warning">Developer tool</span>
      </div>
      <p className="ijp-muted small mb-3">
        Temporary sign-in for integration testing. Member 2 is building the real
        login screen; this panel is removed from production builds.
      </p>

      {checking ? (
        <p className="ijp-muted small mb-0">Checking your session...</p>
      ) : user ? (
        <SignedIn user={user} busy={busy} onSignOut={signOut} />
      ) : (
        <SignedOut
          mode={mode}
          setMode={setMode}
          role={role}
          setRole={setRole}
          form={form}
          update={update}
          busy={busy}
          onSubmit={submit}
        />
      )}

      {notice ? (
        <div className="alert alert-info py-2 px-3 small mt-3 mb-0">{notice}</div>
      ) : null}

      {error ? (
        <div className="mt-3">
          <ErrorAlert message={error} />
          {fieldErrors ? (
            <ul className="small ijp-muted mb-0">
              {Object.entries(fieldErrors).map(([field, message]) => (
                <li key={field}>
                  <strong>{field}</strong>: {message}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function SignedIn({ user, busy, onSignOut }) {
  return (
    <>
      <dl className="small mb-3">
        <Row label="Signed in as">{user.fullName}</Row>
        <Row label="Email">
          <span className="ijp-data">{user.email}</span>
        </Row>
        <Row label="Role">
          <span className="badge text-bg-light border">{user.role}</span>
        </Row>
        <Row label="Status">{user.accountStatus}</Row>
      </dl>

      {user.accountStatus === "PENDING" ? (
        <p className="ijp-muted small">
          This account is awaiting administrator approval, so it cannot publish
          internships yet. That is the intended workflow, not an error.
        </p>
      ) : null}

      <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onSignOut} disabled={busy}>
        Sign out
      </button>
    </>
  );
}

function Row({ label, children }) {
  return (
    <div className="d-flex flex-wrap gap-2 py-1">
      <dt className="fw-normal ijp-muted" style={{ flex: "0 0 6.5rem" }}>
        {label}
      </dt>
      <dd className="mb-0 flex-grow-1" style={{ minWidth: "10rem" }}>
        {children}
      </dd>
    </div>
  );
}

function SignedOut({ mode, setMode, role, setRole, form, update, busy, onSubmit }) {
  const registering = mode === "register";

  return (
    <form onSubmit={onSubmit} className="d-grid gap-2">
      <div className="btn-group btn-group-sm mb-1" role="group" aria-label="Sign in or register">
        <button
          type="button"
          className={`btn ${registering ? "btn-outline-secondary" : "btn-ijp-primary"}`}
          onClick={() => setMode("login")}
        >
          Sign in
        </button>
        <button
          type="button"
          className={`btn ${registering ? "btn-ijp-primary" : "btn-outline-secondary"}`}
          onClick={() => setMode("register")}
        >
          Create a test account
        </button>
      </div>

      {registering ? (
        <div>
          <label className="form-label small fw-semibold" htmlFor="devRole">
            Role
          </label>
          <select
            id="devRole"
            className="form-select form-select-sm"
            value={role}
            onChange={(event) => setRole(event.target.value)}
          >
            <option value="STUDENT">Student</option>
            <option value="EMPLOYER">Employer</option>
          </select>
        </div>
      ) : null}

      <div>
        <label className="form-label small fw-semibold" htmlFor="devEmail">
          Email
        </label>
        <input
          id="devEmail"
          type="email"
          className="form-control form-control-sm"
          value={form.email}
          onChange={(event) => update("email", event.target.value)}
          autoComplete="username"
          required
        />
      </div>

      <div>
        <label className="form-label small fw-semibold" htmlFor="devPassword">
          Password
        </label>
        <input
          id="devPassword"
          type="password"
          className="form-control form-control-sm"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          autoComplete={registering ? "new-password" : "current-password"}
          required
        />
        {registering ? (
          <p className="ijp-muted small mb-0 mt-1">At least 8 characters.</p>
        ) : null}
      </div>

      {registering ? (
        <>
          <div>
            <label className="form-label small fw-semibold" htmlFor="devFullName">
              Full name
            </label>
            <input
              id="devFullName"
              className="form-control form-control-sm"
              value={form.fullName}
              onChange={(event) => update("fullName", event.target.value)}
              required
            />
          </div>

          {role === "STUDENT" ? (
            <div>
              <label className="form-label small fw-semibold" htmlFor="devUniversity">
                University <span className="ijp-muted fw-normal">(optional)</span>
              </label>
              <input
                id="devUniversity"
                className="form-control form-control-sm"
                value={form.university}
                onChange={(event) => update("university", event.target.value)}
              />
            </div>
          ) : (
            <div>
              <label className="form-label small fw-semibold" htmlFor="devCompany">
                Company name
              </label>
              <input
                id="devCompany"
                className="form-control form-control-sm"
                value={form.companyName}
                onChange={(event) => update("companyName", event.target.value)}
                required
              />
            </div>
          )}
        </>
      ) : null}

      <button type="submit" className="btn btn-ijp-primary btn-sm" disabled={busy}>
        {busy ? "Working..." : registering ? "Create and sign in" : "Sign in"}
      </button>

      <p className="ijp-muted small mb-0">
        There is no administrator registration by design. Create the first admin
        with the bootstrap runner - see the README.
      </p>
    </form>
  );
}

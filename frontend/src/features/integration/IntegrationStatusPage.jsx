import { useCallback, useEffect, useState } from "react";
import { version as reactVersion } from "react";
import { platformApi } from "../../api/platformApi.js";
import { authApi } from "../../api/authApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { appConfig } from "../../config/appConfig.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusCard from "../../components/shared/StatusCard.jsx";
import DevSessionPanel from "./DevSessionPanel.jsx";

/**
 * Integration status - Member 1's development utility.
 *
 * It answers one question per card, in the order the connections actually
 * chain together:
 *
 *   Frontend  is React running, and in which mode      (local, no request)
 *   Backend   can React reach Spring Boot              GET /api/test/health
 *   Database  can Spring Boot reach MariaDB            GET /api/test/database
 *   AI        is Groq configured, and does it answer   GET /api/test/ai
 *   Session   does the session cookie round-trip       GET /api/auth/me
 *
 * TWO RULES THIS PAGE EXISTS TO KEEP
 *
 *   Nothing is ever assumed. A card turns green because a request came back,
 *   never because the code hoped it would. If the backend is down, the three
 *   checks behind it report "not checked" rather than "failed" - saying a
 *   database is broken when you never reached it is a lie that costs an hour.
 *
 *   Each check owns its own state, so one failure cannot blank the page. A
 *   thrown error in the AI check must still leave the database card readable.
 *
 * No secret is ever displayed. The AI card shows the provider and model; the
 * key is never sent to the browser in the first place.
 */
export default function IntegrationStatusPage() {
  const [checks, setChecks] = useState(initialState);
  const [checkedAt, setCheckedAt] = useState(null);
  const [running, setRunning] = useState(false);

  const runChecks = useCallback(async () => {
    setRunning(true);
    setChecks(initialState());

    // The frontend check needs no network: if this code is executing, React
    // is running. Saying so explicitly is still useful - it tells you the
    // build loaded at all.
    setChecks((current) => ({
      ...current,
      frontend: {
        state: "ok",
        data: { react: reactVersion, mode: import.meta.env.MODE, origin: window.location.origin },
      },
    }));

    // Backend first. Everything else runs through it, so if it is down the
    // rest cannot be tested - and must not be reported as failing.
    try {
      const health = await platformApi.checkHealth();
      setChecks((current) => ({ ...current, backend: { state: "ok", data: health } }));
    } catch (error) {
      setChecks((current) => ({
        ...current,
        backend: { state: "error", error: describeApiError(error) },
        database: { state: "skipped" },
        ai: { state: "skipped" },
        session: { state: "skipped" },
      }));
      setCheckedAt(new Date());
      setRunning(false);
      return;
    }

    // The remaining three are independent, so one failing must not stop the
    // others. Promise.allSettled rather than await in sequence.
    await Promise.allSettled([
      platformApi
        .checkDatabase()
        .then((data) => setChecks((c) => ({ ...c, database: { state: "ok", data } })))
        .catch((error) =>
          setChecks((c) => ({
            ...c,
            database: { state: "error", error: describeApiError(error) },
          })),
        ),

      platformApi
        .checkAi()
        .then((data) => setChecks((c) => ({ ...c, ai: { state: "ok", data } })))
        .catch((error) =>
          setChecks((c) => ({ ...c, ai: { state: "error", error: describeApiError(error) } })),
        ),

      authApi
        .me()
        .then((user) => setChecks((c) => ({ ...c, session: { state: "ok", data: user } })))
        // A 401 here is not a failure of the platform - it means nobody is
        // signed in, which is a perfectly valid state to be in.
        .catch(() => setChecks((c) => ({ ...c, session: { state: "anonymous" } }))),
    ]);

    setCheckedAt(new Date());
    setRunning(false);
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  return (
    <>
      <PageHeader
        title="Integration status"
        subtitle="Live check of the connections between React, Spring Boot, MariaDB and the AI provider."
        action={
          <button
            type="button"
            className="btn btn-ijp-primary btn-sm"
            onClick={runChecks}
            disabled={running}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            {running ? "Checking..." : "Refresh checks"}
          </button>
        }
      />

      <div className="row g-3 mb-3">
        <div className="col-12 col-md-6 col-xl-4">
          <FrontendCard check={checks.frontend} />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <BackendCard check={checks.backend} />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <DatabaseCard check={checks.database} />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <AiCard check={checks.ai} />
        </div>
        <div className="col-12 col-md-6 col-xl-4">
          <SessionCard check={checks.session} />
        </div>
      </div>

      <p className="ijp-muted small mb-4">
        Backend: <span className="ijp-data">{appConfig.apiBaseUrl}</span>
        {checkedAt ? <> &middot; last checked {checkedAt.toLocaleTimeString()}</> : null}
      </p>

      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <DevSessionPanel />
        </div>
      </div>
    </>
  );
}

function initialState() {
  return {
    frontend: { state: "loading" },
    backend: { state: "loading" },
    database: { state: "loading" },
    ai: { state: "loading" },
    session: { state: "loading" },
  };
}

/* ------------------------------------------------------------------ cards */

function FrontendCard({ check }) {
  if (check.state !== "ok") {
    return <StatusCard label="Frontend" icon="bi-window" value="Starting..." />;
  }
  return (
    <StatusCard
      label="Frontend"
      icon="bi-window"
      tone="ok"
      value="Running"
      detail="React rendered this page, so the bundle loaded correctly."
      rows={[
        { label: "React", value: check.data.react },
        { label: "Mode", value: check.data.mode },
        { label: "Origin", value: check.data.origin },
      ]}
    />
  );
}

function BackendCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="Backend API" icon="bi-hdd-network" value="Checking..." />;
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="Backend API"
        icon="bi-hdd-network"
        tone="bad"
        value="Unavailable"
        detail={check.error}
      />
    );
  }
  return (
    <StatusCard
      label="Backend API"
      icon="bi-hdd-network"
      tone="ok"
      value="Connected"
      detail="Spring Boot answered the health check."
      rows={[
        { label: "Application", value: check.data.application },
        { label: "Status", value: check.data.status },
      ]}
    />
  );
}

function DatabaseCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="MariaDB" icon="bi-database" value="Checking..." />;
  }
  if (check.state === "skipped") {
    return (
      <StatusCard
        label="MariaDB"
        icon="bi-database"
        value="Not checked"
        detail="The backend could not be reached, so this was never tested."
      />
    );
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="MariaDB"
        icon="bi-database"
        tone="bad"
        value="Check failed"
        detail={check.error}
      />
    );
  }
  if (!check.data.connected) {
    return (
      <StatusCard
        label="MariaDB"
        icon="bi-database"
        tone="bad"
        value="Unavailable"
        detail={check.data.error ?? "The backend could not query MariaDB. Is MySQL started in XAMPP?"}
      />
    );
  }
  return (
    <StatusCard
      label="MariaDB"
      icon="bi-database"
      tone="ok"
      value={`Connected \u2014 ${check.data.database}`}
      detail="The backend ran a real query against the schema."
      rows={[
        { label: "Tables", value: String(check.data.tableCount ?? "-") },
        { label: "Server", value: check.data.productVersion ?? "-" },
      ]}
    />
  );
}

function AiCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="Groq AI" icon="bi-stars" value="Checking..." />;
  }
  if (check.state === "skipped") {
    return (
      <StatusCard
        label="Groq AI"
        icon="bi-stars"
        value="Not checked"
        detail="The backend could not be reached, so this was never tested."
      />
    );
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="Groq AI"
        icon="bi-stars"
        tone="bad"
        value="Check failed"
        detail={check.error}
      />
    );
  }

  const { provider, configured, reachable, model, latencyMs, error } = check.data;

  // Three genuinely different states, not one generic failure. "No key" is a
  // configuration choice; "unreachable" is a problem worth investigating.
  if (!configured) {
    return (
      <StatusCard
        label="Groq AI"
        icon="bi-stars"
        tone="warn"
        value="API key not configured"
        detail="Set GROQ_API_KEY in backend/application-local.properties. The calculated reports work without it."
        rows={[{ label: "Provider", value: provider }]}
      />
    );
  }
  if (!reachable) {
    return (
      <StatusCard
        label="Groq AI"
        icon="bi-stars"
        tone="bad"
        value="Configured but unreachable"
        detail={error ?? "The key is set but the provider did not answer."}
        rows={[{ label: "Provider", value: provider }]}
      />
    );
  }
  return (
    <StatusCard
      label="Groq AI"
      icon="bi-stars"
      tone="ok"
      value="Connected"
      detail="The backend reached the provider and the key was accepted."
      rows={[
        { label: "Provider", value: provider },
        { label: "Model", value: model ?? "-" },
        { label: "Latency", value: latencyMs != null ? `${latencyMs} ms` : "-" },
      ]}
    />
  );
}

function SessionCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="Session" icon="bi-person-badge" value="Checking..." />;
  }
  if (check.state === "skipped") {
    return (
      <StatusCard
        label="Session"
        icon="bi-person-badge"
        value="Not checked"
        detail="The backend could not be reached."
      />
    );
  }
  if (check.state === "anonymous") {
    return (
      <StatusCard
        label="Session"
        icon="bi-person-badge"
        tone="warn"
        value="Not authenticated"
        detail="Nobody is signed in. That is a valid state, not an error."
      />
    );
  }
  return (
    <StatusCard
      label="Session"
      icon="bi-person-badge"
      tone="ok"
      value="Authenticated"
      detail="The session cookie made a full round trip to the backend and back."
      rows={[
        { label: "Name", value: check.data.fullName },
        { label: "Role", value: check.data.role },
        { label: "Status", value: check.data.accountStatus },
      ]}
    />
  );
}

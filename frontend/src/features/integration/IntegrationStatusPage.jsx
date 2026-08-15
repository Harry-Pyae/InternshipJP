import { useCallback, useEffect, useState } from "react";
import { platformApi } from "../../api/platformApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { appConfig } from "../../config/appConfig.js";
import PageHeader from "../../components/shared/PageHeader.jsx";
import StatusCard from "../../components/shared/StatusCard.jsx";
import DevSessionPanel from "./DevSessionPanel.jsx";

/**
 * Integration Status - Member 1's page.
 *
 * It checks the three connections this project depends on, in order, using
 * real API calls:
 *
 *   React       -> Spring Boot     GET /api/test/health
 *   Spring Boot -> MariaDB         GET /api/test/database
 *   Spring Boot -> Groq            GET /api/test/ai
 *
 * NOTHING HERE IS FAKED. A card turns green only because a request succeeded.
 * If the backend is not running, the first card says so and names the URL it
 * tried, which is the fastest way to spot a wrong port or a missing CORS origin.
 */
export default function IntegrationStatusPage() {
  const [checks, setChecks] = useState({
    backend: { state: "loading" },
    database: { state: "loading" },
    ai: { state: "loading" },
  });
  const [checkedAt, setCheckedAt] = useState(null);

  const runChecks = useCallback(async () => {
    setChecks({
      backend: { state: "loading" },
      database: { state: "loading" },
      ai: { state: "loading" },
    });

    // The backend is checked first: if it is down, the other two cannot be
    // checked at all and saying "unknown" is more honest than "failed".
    let backendUp = false;
    try {
      const health = await platformApi.checkHealth();
      backendUp = true;
      setChecks((current) => ({ ...current, backend: { state: "ok", data: health } }));
    } catch (error) {
      setChecks({
        backend: { state: "error", error: describeApiError(error) },
        database: { state: "skipped" },
        ai: { state: "skipped" },
      });
      setCheckedAt(new Date());
      return;
    }

    if (backendUp) {
      try {
        const database = await platformApi.checkDatabase();
        setChecks((current) => ({ ...current, database: { state: "ok", data: database } }));
      } catch (error) {
        setChecks((current) => ({
          ...current,
          database: { state: "error", error: describeApiError(error) },
        }));
      }

      try {
        const ai = await platformApi.checkAi();
        setChecks((current) => ({ ...current, ai: { state: "ok", data: ai } }));
      } catch (error) {
        setChecks((current) => ({
          ...current,
          ai: { state: "error", error: describeApiError(error) },
        }));
      }
    }

    setCheckedAt(new Date());
  }, []);

  useEffect(() => {
    runChecks();
  }, [runChecks]);

  const anyLoading = Object.values(checks).some((check) => check.state === "loading");

  return (
    <>
      <PageHeader
        title="Integration status"
        subtitle="Live check of the three connections this platform depends on."
        action={
          <button
            type="button"
            className="btn btn-ijp-primary"
            onClick={runChecks}
            disabled={anyLoading}
          >
            <i className="bi bi-arrow-clockwise me-1" aria-hidden="true" />
            {anyLoading ? "Checking..." : "Check again"}
          </button>
        }
      />

      <div className="row g-4">
        <div className="col-12 col-lg-4">
          <BackendCard check={checks.backend} />
        </div>
        <div className="col-12 col-lg-4">
          <DatabaseCard check={checks.database} />
        </div>
        <div className="col-12 col-lg-4">
          <AiCard check={checks.ai} />
        </div>
      </div>

      <p className="ijp-muted small mt-4 mb-4">
        Backend: <span className="ijp-mono">{appConfig.apiBaseUrl}</span>
        {checkedAt ? <> &middot; last checked {checkedAt.toLocaleTimeString()}</> : null}
      </p>

      {/*
        Sign-in for integration testing. Removed from production builds, and
        deleted entirely once Member 2 ships the real login screen.
      */}
      <div className="row g-4">
        <div className="col-12 col-lg-5">
          <DevSessionPanel />
        </div>
      </div>
    </>
  );
}

function BackendCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="Backend" icon="bi-hdd-network" value="Checking..." />;
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="Backend"
        icon="bi-hdd-network"
        tone="bad"
        value="Not reachable"
        detail={check.error}
      />
    );
  }
  return (
    <StatusCard
      label="Backend"
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
    return <StatusCard label="Database" icon="bi-database" value="Checking..." />;
  }
  if (check.state === "skipped") {
    return (
      <StatusCard
        label="Database"
        icon="bi-database"
        value="Not checked"
        detail="Start the backend first."
      />
    );
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="Database"
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
        label="Database"
        icon="bi-database"
        tone="bad"
        value="Not connected"
        detail={check.data.error ?? "The backend could not query MariaDB."}
      />
    );
  }
  return (
    <StatusCard
      label="Database"
      icon="bi-database"
      tone="ok"
      value={`Connected - ${check.data.database}`}
      detail="The backend queried MariaDB successfully."
      rows={[
        { label: "Tables", value: String(check.data.tableCount ?? "-") },
        { label: "Server", value: check.data.productVersion ?? "-" },
      ]}
    />
  );
}

function AiCard({ check }) {
  if (check.state === "loading") {
    return <StatusCard label="AI provider" icon="bi-stars" value="Checking..." />;
  }
  if (check.state === "skipped") {
    return (
      <StatusCard
        label="AI provider"
        icon="bi-stars"
        value="Not checked"
        detail="Start the backend first."
      />
    );
  }
  if (check.state === "error") {
    return (
      <StatusCard
        label="AI provider"
        icon="bi-stars"
        tone="bad"
        value="Check failed"
        detail={check.error}
      />
    );
  }

  const { provider, configured, reachable, model, latencyMs, error } = check.data;

  // "Not configured" is not a failure - the platform is designed to run
  // without AI, so it is shown as a warning with the fix.
  if (!configured) {
    return (
      <StatusCard
        label="AI provider"
        icon="bi-stars"
        tone="warn"
        value="Not configured"
        detail="Set GROQ_API_KEY in backend/application-local.properties to enable the assistant."
        rows={[{ label: "Provider", value: provider }]}
      />
    );
  }
  if (!reachable) {
    return (
      <StatusCard
        label="AI provider"
        icon="bi-stars"
        tone="bad"
        value="Configured, not reachable"
        detail={error ?? "The provider did not answer."}
        rows={[{ label: "Provider", value: provider }]}
      />
    );
  }
  return (
    <StatusCard
      label="AI provider"
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

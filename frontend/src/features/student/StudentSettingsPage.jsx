import { useEffect, useState } from "react";

import PageHeader from "../../components/shared/PageHeader.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import SectionCard from "../../components/shared/SectionCard.jsx";
import { describeApiError } from "../../api/axiosClient.js";
import { accountApi } from "../../api/accountApi.js";
import { twoFactorApi } from "../../api/twoFactorApi.js";

export default function StudentSettingsPage() {
  const [account, setAccount] = useState(null);
  const [twoFactor, setTwoFactor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [totpSetup, setTotpSetup] = useState(null);
  const [totpCode, setTotpCode] = useState("");
  const [totpMessage, setTotpMessage] = useState("");
  const [totpError, setTotpError] = useState("");
  const [totpLoading, setTotpLoading] = useState(false);

  const [emailOtpCode, setEmailOtpCode] = useState("");
  const [emailOtpMessage, setEmailOtpMessage] = useState("");
  const [emailOtpError, setEmailOtpError] = useState("");
  const [emailOtpLoading, setEmailOtpLoading] = useState(false);


  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError("");

        const [accountData, twoFactorData] = await Promise.all([
          accountApi.getAccount(),
          accountApi.getTwoFactorStatus(),
        ]);

        setAccount(accountData);
        setTwoFactor(twoFactorData);
      } catch (err) {
        setError(describeApiError(err));
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleChangePassword(event) {
  event.preventDefault();

  setPasswordMessage("");
  setPasswordError("");

  if (newPassword !== confirmPassword) {
    setPasswordError("New passwords do not match.");
    return;
  }

  if (newPassword.length < 8) {
    setPasswordError("New password must be at least 8 characters.");
    return;
  }

  try {
    setChangingPassword(true);

    await accountApi.changePassword({
      currentPassword,
      newPassword,
    });

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage("Password changed successfully.");
  } catch (err) {
    setPasswordError(describeApiError(err));
  } finally {
    setChangingPassword(false);
  }
}

async function handleSetupTotp() {
  setTotpMessage("");
  setTotpError("");

  try {
    setTotpLoading(true);

    const data = await twoFactorApi.setupTotp();
    setTotpSetup(data);
  } catch (err) {
    setTotpError(describeApiError(err));
  } finally {
    setTotpLoading(false);
  }
}

async function handleVerifyTotp(event) {
  event.preventDefault();

  setTotpMessage("");
  setTotpError("");

  try {
    setTotpLoading(true);

    const data = await twoFactorApi.verifyTotp(totpCode);

    setTotpMessage(data.message || "Authenticator app enabled.");
    setTotpCode("");
    setTotpSetup(null);

    const updatedStatus = await accountApi.getTwoFactorStatus();
    setTwoFactor(updatedStatus);
  } catch (err) {
    setTotpError(describeApiError(err));
  } finally {
    setTotpLoading(false);
  }
}

async function handleDisableTotp() {
  setTotpMessage("");
  setTotpError("");

  try {
    setTotpLoading(true);

    const data = await twoFactorApi.disableTotp();

    setTotpMessage(data.message || "Authenticator app disabled.");

    const updatedStatus = await accountApi.getTwoFactorStatus();
    setTwoFactor(updatedStatus);
  } catch (err) {
    setTotpError(describeApiError(err));
  } finally {
    setTotpLoading(false);
  }
}

async function handleSendEmailOtp() {
  setEmailOtpMessage("");
  setEmailOtpError("");

  try {
    setEmailOtpLoading(true);

    const data = await twoFactorApi.sendEmailOtp();

    setEmailOtpMessage(
      data.message || "We sent a verification code to your email address."
    );
  } catch (err) {
    setEmailOtpError(describeApiError(err));
  } finally {
    setEmailOtpLoading(false);
  }
}

async function handleVerifyEmailOtp(event) {
  event.preventDefault();

  setEmailOtpMessage("");
  setEmailOtpError("");

  try {
    setEmailOtpLoading(true);

    const data = await twoFactorApi.verifyEmailOtp(emailOtpCode);

    setEmailOtpMessage(
      data.message || "Email verification enabled."
    );

    setEmailOtpCode("");

    const updatedStatus = await accountApi.getTwoFactorStatus();
    setTwoFactor(updatedStatus);
  } catch (err) {
    setEmailOtpError(describeApiError(err));
  } finally {
    setEmailOtpLoading(false);
  }
}

async function handleDisableEmailOtp() {
  setEmailOtpMessage("");
  setEmailOtpError("");

  try {
    setEmailOtpLoading(true);

    const data = await twoFactorApi.disableEmailOtp();

    setEmailOtpMessage(
      data.message || "Email verification disabled."
    );

    const updatedStatus = await accountApi.getTwoFactorStatus();
    setTwoFactor(updatedStatus);
  } catch (err) {
    setEmailOtpError(describeApiError(err));
  } finally {
    setEmailOtpLoading(false);
  }
}

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account and security."
      />

      {loading ? <LoadingBlock /> : null}

      {error ? <ErrorAlert message={error} /> : null}

      {!loading && !error && account ? (
        <div className="d-grid gap-4">
          <SectionCard title="Account">
            <div className="row g-3">
              <div className="col-md-6">
                <div className="ijp-label">Name</div>
                <div className="ijp-data">
                  {account.fullName || account.name || "Not provided"}
                </div>
              </div>

              <div className="col-md-6">
                <div className="ijp-label">Email</div>
                <div className="ijp-data">
                  {account.email || "Not provided"}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Two-factor authentication">
  <div className="d-grid gap-3">
    <div>
      <div className="ijp-label">Authenticator app</div>

      <div className="ijp-data mb-3">
        {twoFactor?.totpEnabled
          ? "Authenticator app is enabled."
          : "Authenticator app is not enabled."}
      </div>

      {!twoFactor?.totpEnabled && !totpSetup ? (
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleSetupTotp}
          disabled={totpLoading}
        >
          {totpLoading ? "Starting..." : "Set up authenticator app"}
        </button>
      ) : null}

      {totpSetup ? (
        <div className="border rounded p-3">
          <p className="mb-2">
            Open your authenticator app and add this account.
          </p>

          <div className="ijp-label">Secret key</div>

          <code className="d-block mb-3">
            {totpSetup.secret}
          </code>

          <form onSubmit={handleVerifyTotp}>
            <label className="form-label">
              Enter the 6-digit code
            </label>

            <input
              type="text"
              className="form-control mb-3"
              value={totpCode}
              onChange={(event) => setTotpCode(event.target.value)}
              maxLength={6}
              inputMode="numeric"
              pattern="[0-9]{6}"
              required
            />

            <button
              type="submit"
              className="btn btn-primary"
              disabled={totpLoading}
            >
              {totpLoading ? "Verifying..." : "Verify and enable"}
            </button>
          </form>
        </div>
      ) : null}

      {twoFactor?.totpEnabled ? (
        <button
          type="button"
          className="btn btn-outline-danger"
          onClick={handleDisableTotp}
          disabled={totpLoading}
        >
          {totpLoading ? "Disabling..." : "Disable authenticator app"}
        </button>
      ) : null}

      {totpError ? <ErrorAlert message={totpError} /> : null}

      {totpMessage ? (
        <div className="alert alert-success mb-0 mt-3">
          {totpMessage}
        </div>
      ) : null}
    </div>
  </div>
</SectionCard>

          <SectionCard title="Email verification">
            <div className="d-grid gap-3">
              <div>
                <div className="ijp-label">Email verification</div>

                <div className="ijp-data mb-3">
                  {twoFactor?.emailOtpEnabled
                    ? "Email verification is enabled."
                    : "Email verification is not enabled."}
                </div>

                {!twoFactor?.emailOtpEnabled ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={handleSendEmailOtp}
                    disabled={emailOtpLoading}
                  >
                    {emailOtpLoading ? "Sending..." : "Send verification code"}
                  </button>
                ) : null}

                {!twoFactor?.emailOtpEnabled ? (
                  <form
                    onSubmit={handleVerifyEmailOtp}
                    className="mt-3"
                  >
                    <label className="form-label">
                      Enter the 6-digit code
                    </label>

                    <input
                      type="text"
                      className="form-control mb-3"
                      value={emailOtpCode}
                      onChange={(event) =>
                        setEmailOtpCode(event.target.value)
                      }
                      maxLength={6}
                      inputMode="numeric"
                      pattern="[0-9]{6}"
                      required
                    />

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={emailOtpLoading}
                    >
                      {emailOtpLoading
                        ? "Verifying..."
                        : "Verify and enable"}
                    </button>
                  </form>
                ) : null}

                {twoFactor?.emailOtpEnabled ? (
                  <button
                    type="button"
                    className="btn btn-outline-danger"
                    onClick={handleDisableEmailOtp}
                    disabled={emailOtpLoading}
                  >
                    {emailOtpLoading
                      ? "Disabling..."
                      : "Disable email verification"}
                  </button>
                ) : null}

                {emailOtpError ? (
                  <div className="mt-3">
                    <ErrorAlert message={emailOtpError} />
                  </div>
                ) : null}

                {emailOtpMessage ? (
                  <div className="alert alert-success mb-0 mt-3">
                    {emailOtpMessage}
                  </div>
                ) : null}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Change password">
            <form onSubmit={handleChangePassword}>
                <div className="row g-3">
                    <div className="col-12">
                         <label className="form-label">Current password</label>
        <input
          type="password"
          className="form-control"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">New password</label>
        <input
          type="password"
          className="form-control"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      <div className="col-md-6">
        <label className="form-label">Confirm new password</label>
        <input
          type="password"
          className="form-control"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          minLength={8}
          required
        />
      </div>

      {passwordError ? (
        <div className="col-12">
          <ErrorAlert message={passwordError} />
        </div>
      ) : null}

      {passwordMessage ? (
        <div className="col-12">
          <div className="alert alert-success mb-0">
            {passwordMessage}
          </div>
        </div>
      ) : null}

      <div className="col-12">
        <button
          type="submit"
          className="btn btn-primary"
          disabled={changingPassword}
        >
          {changingPassword ? "Changing..." : "Change password"}
        </button>
      </div>
    </div>
  </form>
</SectionCard>


        </div>
      ) : null}
    </>
  );
}
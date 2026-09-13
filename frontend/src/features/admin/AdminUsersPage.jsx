import { useCallback, useEffect, useState } from "react";
import Select from "../../components/shared/Select.jsx";

import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import UserTable from "./components/UserTable.jsx";
import UserDetailModal from "./components/UserDetailModal.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useSearchParams } from "react-router-dom";
import ConfirmDialog from "../../components/shared/ConfirmDialog.jsx";
import { useAuth } from "../../config/authContext.jsx";

export default function AdminUsersPage() {
  const { user: authUser } = useAuth();
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  // Filters start from the URL, so a link can arrive pre-filtered - the
  // company review page links here for "the recruiters on this company".
  const [params] = useSearchParams();
  const [role, setRole] = useState(params.get("role") ?? "");
  const [status, setStatus] = useState(params.get("status") ?? "");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);
  // One dialog for both actions. The browser's own prompt and confirm are
  // drawn by the operating system, ignore the theme, and cannot hold a
  // reason field beside the question.
  const [dialog, setDialog] = useState(null);
  const [invite, setInvite] = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteDone, setInviteDone] = useState("");
  const [detail, setDetail] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await adminApi.listUsers({ role, status, search, page, size: 20 });
      setData(result);
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setLoading(false);
    }
  }, [role, status, search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function submitSearch(event) {
    event.preventDefault();
    setPage(0);
    setSearch(searchInput.trim());
  }

  function changeRole(value) {
    setPage(0);
    setRole(value);
  }

  function changeStatus(value) {
    setPage(0);
    setStatus(value);
  }

  /**
   * Deleting asks the administrator to type the email.
   *
   * window.confirm on a destructive, irreversible action is one careless
   * Enter away from removing the wrong person - and unlike suspension there is
   * nothing to undo. Typing the address forces you to read which row you are
   * on.
   */
  function removeUser(user) {
    setDialog({
      kind: "delete",
      user,
      title: "Delete this account permanently",
      message: `This deletes ${user.fullName || user.email} and everything attached `
        + `to the account: applications, certificates and notifications.`,
      note: "The account must already be suspended. Suspending is reversible and is "
        + "usually the better choice.",
      confirmLabel: "Delete permanently",
      confirmWord: "DELETE",
    });
  }

  async function confirmDelete(user) {
    setBusyId(user.id);
    setError("");
    try {
      await adminApi.deleteUser(user.id);
      // The account is gone, so the panel describing it must go too.
      setDetail(null);
      setDialog(null);
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
      setDialog(null);
    } finally {
      setBusyId(null);
    }
  }

  function toggleUser(user) {
    const suspending = user.accountStatus !== "SUSPENDED";
    const who = user.fullName || user.email;

    setDialog(
      suspending
        ? {
            kind: "suspend",
            user,
            title: "Suspend this account",
            message: `${who} will not be able to sign in.`,
            note: "They are sent the reason exactly as you type it, so write it for "
              + "them to read.",
            confirmLabel: "Suspend account",
            requireReason: true,
            reasonLabel: "Why is this account being suspended?",
            reasonHint: "For example: inactive for 12 months, duplicate account, or "
              + "a policy the account breached.",
          }
        : {
            kind: "reactivate",
            user,
            tone: "neutral",
            title: "Reactivate this account",
            message: `${who} will be able to sign in again.`,
            confirmLabel: "Reactivate",
          },
    );
  }

  async function confirmStatus(user, nextStatus, reason) {
    setBusyId(user.id);
    setError("");
    try {
      await adminApi.updateUserStatus(user.id, nextStatus, reason);
      setDetail((current) =>
        current && current.id === user.id ? { ...current, accountStatus: nextStatus } : current,
      );
      setDialog(null);
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
      setDialog(null);
    } finally {
      setBusyId(null);
    }
  }

  async function sendInvite(event) {
    event.preventDefault();
    setInviteBusy(true);
    setError("");
    try {
      const result = await adminApi.inviteAdmin(invite);
      setInvite(null);
      setInviteDone(result?.message ?? "Invitation sent.");
      // The invited account is a PENDING administrator, so it appears in the
      // list immediately under the filters that already exist.
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setInviteBusy(false);
    }
  }

  /** One place that knows what each dialog does when it is confirmed. */
  function runDialog(reason) {
    if (!dialog) return;
    if (dialog.kind === "delete") {
      confirmDelete(dialog.user);
    } else {
      confirmStatus(dialog.user, dialog.kind === "suspend" ? "SUSPENDED" : "ACTIVE", reason);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage student and employer accounts and their status."
        action={
          <div className="d-flex align-items-center gap-3">
            <span className="ijp-muted small">{data.totalElements} account(s)</span>
            <button
              type="button"
              className="btn btn-sm btn-ijp-primary"
              onClick={() => {
                setInviteDone("");
                setInvite({ email: "", fullName: "" });
              }}
            >
              <i className="bi bi-person-plus me-1" aria-hidden="true" />
              Invite administrator
            </button>
          </div>
        }
      />

      <ErrorAlert message={error} onRetry={load} />

      {inviteDone ? (
        <div className="alert alert-success" role="status">
          {inviteDone}
        </div>
      ) : null}

      {invite ? (
        <div className="ijp-card p-3 p-md-4 mb-4 ijp-invite">
          <p className="ijp-label mb-1">Invite an administrator</p>
          <p className="ijp-muted small mb-3">
            They receive a code by email and choose their own password. Until they
            accept, the account exists but cannot be signed into. You will never
            see or set their password.
          </p>
          <form className="row g-3 align-items-end" onSubmit={sendInvite}>
            <div className="col-md-5">
              <label className="form-label" htmlFor="inviteName">Name</label>
              <input
                id="inviteName"
                className="form-control"
                value={invite.fullName}
                onChange={(event) =>
                  setInvite((current) => ({ ...current, fullName: event.target.value }))
                }
                maxLength={150}
                required
              />
            </div>
            <div className="col-md-5">
              <label className="form-label" htmlFor="inviteEmailAddr">Email</label>
              <input
                id="inviteEmailAddr"
                type="email"
                className="form-control"
                value={invite.email}
                onChange={(event) =>
                  setInvite((current) => ({ ...current, email: event.target.value }))
                }
                placeholder="colleague@example.com"
                maxLength={190}
                required
              />
            </div>
            <div className="col-md-2 d-flex gap-2">
              <button type="submit" className="btn btn-ijp-primary" disabled={inviteBusy}>
                {inviteBusy ? "Sending..." : "Send"}
              </button>
              <button
                type="button"
                className="btn btn-ijp-quiet"
                onClick={() => setInvite(null)}
                disabled={inviteBusy}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="ijp-card p-3 mb-4">
        <form className="row g-3 align-items-end" onSubmit={submitSearch}>
          <div className="col-12 col-lg-5">
            <label className="ijp-label mb-2" htmlFor="admin-user-search">Search</label>
            <input
              id="admin-user-search"
              className="form-control"
              type="search"
              placeholder="Name or email"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </div>
          <div className="col-6 col-lg-3">
              <Select
                value={role}
                onChange={changeRole}
                groups={[
                  {
                    label: null,
                    items: [
                      { value: "", label: "All roles" },
                      { value: "STUDENT", label: "Student" },
                      { value: "EMPLOYER", label: "Employer" },
                      { value: "ADMIN", label: "Administrator" },
                    ],
                  },
                ]}
                placeholder="All roles"
                ariaLabel="Filter by role"
              />
          </div>
          <div className="col-6 col-lg-3">
              <Select
                value={status}
                onChange={changeStatus}
                groups={[
                  {
                    label: null,
                    items: [
                      { value: "", label: "All statuses" },
                      { value: "ACTIVE", label: "Active" },
                      { value: "PENDING", label: "Pending" },
                      { value: "SUSPENDED", label: "Suspended" },
                    ],
                  },
                ]}
                placeholder="All statuses"
                ariaLabel="Filter by status"
              />
          </div>
          <div className="col-12 col-lg-1">
            <button className="btn btn-ijp-primary w-100" type="submit" aria-label="Search users">
              <i className="bi bi-search" aria-hidden="true" />
            </button>
          </div>
        </form>
      </div>

      <div className="ijp-card p-4">
        {loading ? <LoadingBlock label="Loading users..." /> : <UserTable
              currentUserId={authUser?.id}
            rows={data.content}
            busyId={busyId}
            onToggle={toggleUser}
            onDelete={removeUser}
            onView={setDetail}
          />}

        {!loading && data.totalPages > 1 ? (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        ) : null}
      </div>
      {detail ? (
        <UserDetailModal
          user={detail}
          busy={busyId === detail.id}
          onClose={() => setDetail(null)}
          onToggle={toggleUser}
          onDelete={removeUser}
        />
      ) : null}
      <ConfirmDialog
        open={Boolean(dialog)}
        title={dialog?.title}
        message={dialog?.message}
        note={dialog?.note}
        tone={dialog?.tone ?? "danger"}
        confirmLabel={dialog?.confirmLabel}
        requireReason={dialog?.requireReason}
        reasonLabel={dialog?.reasonLabel}
        reasonHint={dialog?.reasonHint}
        confirmWord={dialog?.confirmWord}
        busy={busyId === dialog?.user?.id}
        onConfirm={runDialog}
        onCancel={() => setDialog(null)}
      />
    </>
  );
}

function Pagination({ page, totalPages, onChange }) {
  // One page needs no controls. This rendered regardless, leaving a row of
  // dead buttons under every short list - the shared Pagination component
  // has always had this guard; this local copy did not.
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  return (
    <div className="d-flex justify-content-between align-items-center gap-2 mt-4">
      <button type="button" className="btn btn-sm btn-ijp-quiet" disabled={page === 0} onClick={() => onChange(page - 1)}>
        Previous
      </button>
      <span className="ijp-muted small">Page {page + 1} of {totalPages}</span>
      <button type="button" className="btn btn-sm btn-ijp-quiet" disabled={page + 1 >= totalPages} onClick={() => onChange(page + 1)}>
        Next
      </button>
    </div>
  );
}

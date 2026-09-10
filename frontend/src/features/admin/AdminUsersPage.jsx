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

export default function AdminUsersPage() {
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
  async function removeUser(user) {
    const typed = window.prompt(
      `This permanently deletes ${user.fullName || user.email} and everything ` +
        `attached to the account - applications, certificates and notifications.\n\n` +
        `Suspending is reversible and is usually the better choice.\n\n` +
        `To confirm, type the email address:`,
    );
    if (typed === null) {
      return;
    }
    if (typed.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
      setError("That did not match the email address, so nothing was deleted.");
      return;
    }

    setBusyId(user.id);
    setError("");
    try {
      await adminApi.deleteUser(user.id);
      // The account is gone, so the panel describing it must go too.
      setDetail(null);
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusyId(null);
    }
  }

  async function toggleUser(user) {
    const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const action = nextStatus === "SUSPENDED" ? "suspend" : "reactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName || user.email}?`)) return;

    setBusyId(user.id);
    setError("");
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
      setDetail((current) =>
        current && current.id === user.id ? { ...current, accountStatus: nextStatus } : current,
      );
      await load();
    } catch (requestError) {
      setError(describeApiError(requestError));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Users"
        subtitle="Manage student and employer accounts and their status."
        action={<span className="ijp-muted small">{data.totalElements} account(s)</span>}
      />

      <ErrorAlert message={error} onRetry={load} />

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

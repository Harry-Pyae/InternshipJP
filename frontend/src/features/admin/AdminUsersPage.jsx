import { useCallback, useEffect, useState } from "react";
import Select from "../../components/shared/Select.jsx";

import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import UserTable from "./components/UserTable.jsx";
import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";

export default function AdminUsersPage() {
  const [data, setData] = useState({ content: [], totalElements: 0, totalPages: 0, page: 0 });
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

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

  async function toggleUser(user) {
    const nextStatus = user.accountStatus === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    const action = nextStatus === "SUSPENDED" ? "suspend" : "reactivate";

    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName || user.email}?`)) return;

    setBusyId(user.id);
    setError("");
    try {
      await adminApi.updateUserStatus(user.id, nextStatus);
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
        {loading ? <LoadingBlock label="Loading users..." /> : <UserTable rows={data.content} busyId={busyId} onToggle={toggleUser} />}

        {!loading && data.totalPages > 1 ? (
          <Pagination page={data.page} totalPages={data.totalPages} onChange={setPage} />
        ) : null}
      </div>
    </>
  );
}

function Pagination({ page, totalPages, onChange }) {
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

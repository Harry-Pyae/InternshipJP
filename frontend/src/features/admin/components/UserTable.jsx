import DataTable from "../../../components/shared/DataTable.jsx";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";
import StatusToggle from "./StatusToggle.jsx";
import { timeAgo, exactTime } from "../../../api/relativeTime.js";

const ROLE_LABEL = {
  STUDENT: "Student",
  EMPLOYER: "Employer",
  ADMIN: "Administrator",
};

export default function UserTable({ rows, busyId, onToggle, onDelete, onView }) {
  return (
    <DataTable
      columns={[
        {
          key: "fullName",
          header: "Person",
          // Name and email in one cell. They identify the same person, and two
          // columns made every row twice as wide for no extra information.
          render: (row) => (
            <span className="ijp-person">
              <span className="ijp-person-name">{row.fullName || "Unnamed account"}</span>
              <span className="ijp-person-email">{row.email}</span>
            </span>
          ),
        },
        {
          key: "role",
          header: "Role",
          // ADMIN shouted in a table. A chip reads as a label rather than as
          // emphasis, and the colour separates the three at a glance.
          render: (row) => (
            <span className={`ijp-role ijp-role--${(row.role || "").toLowerCase()}`}>
              {ROLE_LABEL[row.role] ?? row.role}
            </span>
          ),
        },
        {
          key: "accountStatus",
          header: "Status",
          render: (row) => <StatusBadge value={row.accountStatus} />,
        },
        {
          key: "lastLoginAt",
          header: "Last login",
          // Relative, with the exact time on hover. "3 days ago" answers the
          // question an administrator is actually asking; the timestamp is
          // there when the precise moment matters.
          render: (row) =>
            row.lastLoginAt ? (
              <span title={exactTime(row.lastLoginAt)}>{timeAgo(row.lastLoginAt)}</span>
            ) : (
              <span className="ijp-muted">Never</span>
            ),
        },
        {
          key: "createdAt",
          header: "Registered",
          render: (row) => (
            <span title={exactTime(row.createdAt)}>{timeAgo(row.createdAt)}</span>
          ),
        },
        {
          key: "action",
          header: "Action",
          render: (row) => (
            <div className="d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-sm btn-ijp-quiet"
                onClick={() => onView(row)}
                title="Account details and actions"
              >
                <i className="bi bi-eye" aria-hidden="true" />
                <span className="visually-hidden">Details</span>
              </button>
              <StatusToggle
                user={row}
                busy={busyId === row.id}
                onToggle={onToggle}
              />
              {/* Quiet until hovered, because suspending is almost always the
                  right action and this one cannot be undone. */}
              <button
                type="button"
                className="btn btn-sm btn-ijp-quiet ijp-btn-danger"
                onClick={() => onDelete(row)}
                disabled={busyId === row.id}
                title="Delete this account permanently"
              >
                <i className="bi bi-trash" aria-hidden="true" />
                <span className="visually-hidden">Delete</span>
              </button>
            </div>
          ),
        },
      ]}
      rows={rows}
      rowKey={(row) => row.id}
      empty={{
        icon: "bi-people",
        title: "No users found",
        hint: "Try a different search or filter.",
      }}
    />
  );
}


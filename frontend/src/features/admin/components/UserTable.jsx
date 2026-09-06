import DataTable from "../../../components/shared/DataTable.jsx";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";
import StatusToggle from "./StatusToggle.jsx";

export default function UserTable({ rows, busyId, onToggle }) {
  return (
    <DataTable
      columns={[
        { key: "fullName", header: "Name", render: (row) => row.fullName || "—" },
        { key: "email", header: "Email" },
        { key: "role", header: "Role" },
        {
          key: "accountStatus",
          header: "Status",
          render: (row) => <StatusBadge value={row.accountStatus} />,
        },
        {
          key: "lastLoginAt",
          header: "Last login",
          render: (row) => formatDate(row.lastLoginAt),
        },
        {
          key: "createdAt",
          header: "Registered",
          render: (row) => formatDate(row.createdAt),
        },
        {
          key: "action",
          header: "Action",
          render: (row) => (
            <StatusToggle
              user={row}
              busy={busyId === row.id}
              onToggle={onToggle}
            />
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

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

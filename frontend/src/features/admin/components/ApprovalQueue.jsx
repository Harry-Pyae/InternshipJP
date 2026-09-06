import DataTable from "../../../components/shared/DataTable.jsx";
import StatusBadge from "../../../components/shared/StatusBadge.jsx";

export default function ApprovalQueue({ rows, onSelect }) {
  return (
    <DataTable
      columns={[
        { key: "name", header: "Company" },
        { key: "industry", header: "Industry", render: (row) => row.industry || "—" },
        { key: "country", header: "Country", render: (row) => row.country || "—" },
        {
          key: "approvalStatus",
          header: "Status",
          render: (row) => <StatusBadge value={row.approvalStatus} />,
        },
        {
          key: "createdAt",
          header: "Registered",
          render: (row) => formatDate(row.createdAt),
        },
      ]}
      rows={rows}
      rowKey={(row) => row.id}
      onRowClick={onSelect}
      empty={{
        icon: "bi-building-check",
        title: "No companies are waiting for approval",
        hint: "The company approval queue is clear.",
      }}
    />
  );
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

import EmptyState from "./EmptyState.jsx";

/**
 * A list that is a real table on a wide screen and stacked cards on a phone,
 * without you writing two components.
 *
 *   <DataTable
 *     columns={[
 *       { key: "internshipTitle", header: "Internship" },
 *       { key: "companyName",     header: "Company" },
 *       { key: "status",          header: "Status", render: (row) => <StatusBadge value={row.status} /> },
 *     ]}
 *     rows={applications}
 *     rowKey={(row) => row.id}
 *     empty={{ title: "No applications yet", hint: "Apply to an internship to see it here." }}
 *   />
 *
 * A table squeezed onto a 380px screen is unreadable, and horizontal scrolling
 * inside a page is worse. Below 768px each row becomes a small card with the
 * column headers as labels.
 *
 * Owner: Member 4.
 */
export default function DataTable({ columns, rows = [], rowKey, empty, onRowClick }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={empty?.icon ?? "bi-inbox"}
        title={empty?.title ?? "Nothing here yet"}
        hint={empty?.hint}
      />
    );
  }

  return (
    <>
      {/* Wide screens: a normal table. */}
      <div className="table-responsive d-none d-md-block">
        <table className="table align-middle mb-0">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="ijp-label">
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                style={onRowClick ? { cursor: "pointer" } : undefined}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per row, headers become labels. */}
      <div className="d-grid gap-2 d-md-none">
        {rows.map((row) => (
          <div
            className="ijp-card-sunken p-3"
            key={rowKey(row)}
            onClick={onRowClick ? () => onRowClick(row) : undefined}
          >
            {columns.map((column) => (
              <div className="d-flex justify-content-between gap-3 py-1" key={column.key}>
                <span className="ijp-label">{column.header}</span>
                <span className="text-end">
                  {column.render ? column.render(row) : row[column.key]}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

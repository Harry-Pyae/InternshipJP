import EmptyState from "./EmptyState.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A list that is a real table on a wide screen and stacked cards on a phone,
 * without you writing two components.
 */
export default function DataTable({ columns, rows = [], rowKey, empty, onRowClick }) {
  const { t } = useLanguage();
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
        <table className="table align-middle mb-0 ijp-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column.key} scope="col" className="ijp-label">
                  {t(column.header)}
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
                {columns.map((column) => {
                  const value = column.render ? column.render(row) : row[column.key];
                  // A cell that renders to plain text gets it as a tooltip, so an
                  // ellipsised value stays readable. Truncating is only acceptable
                  // when the full text is still reachable somehow.
                  return (
                    <td
                      key={column.key}
                      title={
                        typeof value === "string" || typeof value === "number"
                          ? String(value)
                          : undefined
                      }
                    >
                      {value}
                    </td>
                  );
                })}
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
                <span className="ijp-label">{t(column.header)}</span>
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

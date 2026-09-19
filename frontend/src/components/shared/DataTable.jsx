import { useEffect, useRef } from "react";
import EmptyState from "./EmptyState.jsx";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * A list that is a real table on a wide screen and stacked cards on a phone,
 * without you writing two components.
 *
 * highlightKey marks one row - the record a notification was about - and
 * brings it into view, so arriving from a notification lands on that row
 * rather than on a list the person has to search.
 */
export default function DataTable({ columns, rows, rowKey, empty, onRowClick, highlightKey }) {
  const { t } = useLanguage();
  // Not a default parameter: a default only fills in undefined. Half the
  // callers hold their rows in state that starts as null and stays null when
  // the request fails, and rows.length threw on every one of them.
  const list = rows ?? [];
  const markedRow = useRef(null);
  const markedCard = useRef(null);
  const isMarked = (row) => highlightKey != null && String(rowKey(row)) === String(highlightKey);

  // Before the early return below, so the hook runs on every render. Only one
  // of the two layouts is visible at a time; the hidden one has no offsetParent.
  useEffect(() => {
    if (highlightKey == null) {
      return;
    }
    const target = [markedRow.current, markedCard.current].find((el) => el?.offsetParent);
    target?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [highlightKey, rows]);

  if (list.length === 0) {
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
            {list.map((row) => (
              <tr
                key={rowKey(row)}
                ref={isMarked(row) ? markedRow : undefined}
                className={isMarked(row) ? "ijp-row--arrived" : undefined}
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
        {list.map((row) => (
          <div
            className={`ijp-card-sunken p-3${isMarked(row) ? " ijp-row--arrived" : ""}`}
            key={rowKey(row)}
            ref={isMarked(row) ? markedCard : undefined}
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

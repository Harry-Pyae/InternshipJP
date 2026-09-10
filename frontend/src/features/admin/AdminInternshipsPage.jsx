import { useCallback, useEffect, useState } from "react";

import DataTable from "../../components/shared/DataTable.jsx";
import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { Link } from "react-router-dom";
import { useLanguage } from "../../config/languageContext.jsx";
import SearchBox, { matches } from "../../components/shared/SearchBox.jsx";
import Pagination from "../../components/shared/Pagination.jsx";


export default function AdminInternshipsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const { t } = useLanguage();

  const [data, setData] = useState({
    content: [],
    totalElements: 0
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");


  const load = useCallback(async () => {

    setLoading(true);
    setError("");

    try {

      const result = await adminApi.listInternships({
        page:0,
        size: 200
      });

      setData(result);

    } catch(err){

      setError(describeApiError(err));

    } finally {

      setLoading(false);

    }

  }, []);


  useEffect(()=>{

    load();

  },[load]);



  const rows = data?.content ?? [];

  // Filters what is loaded, not the database. The count beside the box

  // says so - a search that quietly covers less than the user assumes

  // is worse than no search at all.

  const visible = (rows ?? []).filter((row) => matches(row, query, ["title", "companyName", "location"]));

  // Paging and searching both work on the same filtered list, so the
  // page count follows the search rather than ignoring it.
  const PER_PAGE = 15;
  const pageCount = Math.max(1, Math.ceil(visible.length / PER_PAGE));
  const safePage = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE);
  return (

    <>

      <PageHeader
        title="Internships"
        subtitle="View all internships created on the platform."
      />


      <ErrorAlert
        message={error}
        onRetry={load}
      />


      <div className="ijp-card p-4">
        <SearchBox
          value={query}
          onChange={(value) => {
              setQuery(value);
              setPage(0);
            }}
          placeholder={t("Search internships")}
          shown={visible.length}
          total={(rows ?? []).length}
        />


      {
        loading ?

        <LoadingBlock label="Loading internships..." />

        :

        rows.length === 0 ?

        <p className="ijp-muted">
          No internships found.
        </p>

        :

                <>
          <DataTable
              columns={[
                {
                  key: "seq",
                  header: "#",
                  // A position in the list, not the database id. An admin
                  // scanning a page wants "the third one", and a raw id with
                  // gaps in it (6, 5, 4, 2) reads like something is missing.
                  // The real id is still on the row, in the title's tooltip.
                  render: (row) => (
                    <span className="ijp-data ijp-muted">{rows.indexOf(row) + 1}</span>
                  ),
                },
                {
                  key: "title",
                  header: "Title",
                  render: (row) => (
                    <span className="fw-semibold" title={`Internship id ${row.id}`}>
                      {row.title}
                    </span>
                  ),
                },
                { key: "companyName", header: "Company", render: (row) => row.companyName || "—" },
                {
                  key: "location",
                  header: "Location",
                  render: (row) => row.location || "—",
                },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => <StatusBadge value={row.status} />,
                },
                {
                  key: "createdAt",
                  header: "Created",
                  render: (row) => (row.createdAt ? row.createdAt.slice(0, 10) : "—"),
                },
                {
                  key: "actions",
                  header: "",
                  render: (row) => (
                    <div className="d-flex justify-content-end">
                      <Link
                        className="btn btn-sm btn-ijp-quiet"
                        to={`/admin/internships/${row.id}`}
                      >
                        {t("View")}
                        <i className="bi bi-arrow-right ms-1" aria-hidden="true" />
                      </Link>
                    </div>
                  ),
                },
              ]}
              rows={pageRows}
              rowKey={(row) => row.id}
              empty={{
                icon: "bi-megaphone",
                title: "No internships yet",
                hint: "Vacancies created by employers appear here.",
              }}
            />
          <Pagination
            page={safePage}
            pageCount={pageCount}
            total={visible.length}
            onChange={setPage}
            noun="internship"
          />
        </>


      }


      </div>


    </>

  );

}
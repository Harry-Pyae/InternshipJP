import { useCallback, useEffect, useState } from "react";

import DataTable from "../../components/shared/DataTable.jsx";
import PageHeader from "../../components/shared/PageHeader.jsx";
import LoadingBlock from "../../components/shared/LoadingBlock.jsx";
import ErrorAlert from "../../components/shared/ErrorAlert.jsx";
import StatusBadge from "../../components/shared/StatusBadge.jsx";

import { adminApi } from "../../api/adminApi.js";
import { describeApiError } from "../../api/axiosClient.js";


export default function AdminInternshipsPage() {

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
        size:20
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


      {
        loading ?

        <LoadingBlock label="Loading internships..." />

        :

        rows.length === 0 ?

        <p className="ijp-muted">
          No internships found.
        </p>

        :

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
            ]}
            rows={rows}
            rowKey={(row) => row.id}
            empty={{
              icon: "bi-megaphone",
              title: "No internships yet",
              hint: "Vacancies created by employers appear here.",
            }}
          />


      }


      </div>


    </>

  );

}
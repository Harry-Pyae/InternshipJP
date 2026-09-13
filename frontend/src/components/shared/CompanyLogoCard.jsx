import { useCallback, useEffect, useState } from "react";
import SectionCard from "./SectionCard.jsx";
import ImagePicker from "./ImagePicker.jsx";
import { employerApi } from "../../api/employerApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";

/**
 * The company logo: choose, confirm, or remove.
 *
 * Square rather than round, because a logo cropped to a circle loses its
 * corners, which is usually where the wordmark is.
 *
 * It lives on the profile edit page. The company profile displays the logo and
 * nothing more: a page that shows a record should not also be the one place
 * you can alter it.
 */
export default function CompanyLogoCard({ onError }) {
  const { t } = useLanguage();
  const [logo, setLogo] = useState(null);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  // Bumped on every change, so the versioned fetch bypasses the browser cache
  // the endpoint asks for.
  const [version, setVersion] = useState(0);

  const load = useCallback(async () => {
    try {
      const company = await employerApi.getCompany();
      // The record is the truth about whether a logo exists. The image fetch
      // cannot be: it returns null both when there is none and when the
      // request failed.
      const url = company?.logoPath ? await employerApi.fetchCompanyLogo(version) : null;
      // Release the previous blob before replacing it. Without this every
      // reload of the card leaves another image held in memory for the life of
      // the page.
      setLogo((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return url;
      });
    } catch {
      setLogo((previous) => {
        if (previous) URL.revokeObjectURL(previous);
        return null;
      });
    }
  }, [version]);

  useEffect(() => {
    load();
  }, [load]);

  async function run(action) {
    setBusy(true);
    setFailure("");
    try {
      await action();
      setVersion((n) => n + 1);
    } catch (requestError) {
      const message = describeApiError(requestError);
      setFailure(message);
      onError?.(message);
      setVersion((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Company logo">
      {failure ? (
        <div className="alert alert-danger" role="alert">
          {failure}
        </div>
      ) : null}

      <ImagePicker
        current={logo}
        shape="square"
        fallback={
          <span className="ijp-pick ijp-pick--square ijp-logo--empty" aria-hidden="true">
            <i className="bi bi-building" />
          </span>
        }
        hint={t("Shown to students and administrators beside the company name. JPG or PNG.")}
        busy={busy}
        onConfirm={(file) => run(() => employerApi.uploadCompanyLogo(file))}
        onRemove={logo ? () => run(() => employerApi.removeCompanyLogo()) : undefined}
      />
    </SectionCard>
  );
}

import { useEffect, useState } from "react";
import SectionCard from "./SectionCard.jsx";
import Avatar, { invalidatePhoto } from "./Avatar.jsx";
import ImagePicker from "./ImagePicker.jsx";
import { accountApi } from "../../api/accountApi.js";
import { describeApiError } from "../../api/axiosClient.js";
import { useLanguage } from "../../config/languageContext.jsx";
import { useAuth } from "../../config/authContext.jsx";

/**
 * Your own profile photo: choose, confirm, or remove.
 *
 * It belongs on the edit pages rather than the read-only profile, which is
 * where it was: a page that only displays things should not also be the one
 * place you can change the most visible thing on it.
 */
export default function PhotoCard({ onError }) {
  const { t } = useLanguage();
  // Always the signed-in user's own photo, so the identity comes from the
  // session rather than a prop. The profile responses carry a profile id, not
  // a user id, and passing one in was a good way to fetch the wrong face.
  const { user } = useAuth();

  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(null);
  const [version, setVersion] = useState(0);
  // Reported here as well as upwards. The card is placed on several pages and
  // not all of them render an error region, so a failed removal used to leave
  // no trace at all: the image vanished from the card, came back on the next
  // load, and nothing said why.
  const [failure, setFailure] = useState("");

  useEffect(() => {
    if (!user?.id) return undefined;
    let alive = true;
    // The account record is the truth about whether a photo exists. The image
    // fetch cannot be: it swallows every error and returns null, so a request
    // that failed looks exactly like an account with no photo.
    accountApi
      .me()
      .then((account) =>
        account.photoPath ? accountApi.fetchPhoto(user.id, version) : null,
      )
      .then((url) => {
        if (alive) setCurrent(url);
      })
      .catch(() => {
        if (alive) setCurrent(null);
      });
    return () => {
      alive = false;
    };
  }, [user?.id, version]);

  async function run(action) {
    setBusy(true);
    setFailure("");
    try {
      await action();
      // Every avatar on screen refetches: the sidebar, the menu, and any table
      // row showing the same person.
      invalidatePhoto(user?.id);
      setVersion((n) => n + 1);
    } catch (requestError) {
      const message = describeApiError(requestError);
      setFailure(message);
      onError?.(message);
      // Put the card back in step with the server rather than leaving it
      // showing whatever the failed action implied.
      setVersion((n) => n + 1);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SectionCard title="Profile photo">
      {failure ? (
        <div className="alert alert-danger" role="alert">
          {failure}
        </div>
      ) : null}

      <ImagePicker
        current={current}
        fallback={<Avatar name={user?.fullName} userId={user?.id} size="lg" />}
        shape="round"
        hint={t("Shown beside your name wherever it appears. JPG or PNG, up to 5 MB.")}
        busy={busy}
        onConfirm={(file) => run(() => accountApi.uploadPhoto(file))}
        onRemove={current ? () => run(() => accountApi.removePhoto()) : undefined}
      />
    </SectionCard>
  );
}

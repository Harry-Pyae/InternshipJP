import AccountSettingsPage from "../shared/AccountSettingsPage.jsx";
import DataMaintenanceCard from "./components/DataMaintenanceCard.jsx";

/**
 * The administrator's settings.
 *
 * It is the shared account settings page with one extra card. This used to be
 * a second, separate implementation of the same two forms, and the two had
 * drifted: the administrator's copy validated differently, reported saving
 * with a banner at the top of the page rather than beside the button, never
 * told anyone what a valid password looks like, and offered no way to delete
 * the account - which the FAQ tells every role, administrators included, to do
 * from Settings. One page means one set of behaviour for all three roles and
 * one place to fix a bug in it.
 *
 * What genuinely is administrator-only - taking a copy of the platform's data,
 * and compacting it - is passed in rather than built into the shared page.
 */
export default function AdminSettingsPage() {
  return (
    <AccountSettingsPage
      subtitle="Your account, your password, and the platform's stored data."
      extra={<DataMaintenanceCard />}
    />
  );
}

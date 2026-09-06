export default function StatusToggle({ user, busy, onToggle }) {
  const suspended = user.accountStatus === "SUSPENDED";
  const isAdmin = user.role === "ADMIN";

  return (
    <button
      type="button"
      className={suspended ? "btn btn-sm btn-ijp-primary" : "btn btn-sm btn-ijp-quiet"}
      disabled={busy || isAdmin}
      title={isAdmin ? "Administrator accounts cannot be changed from this screen." : undefined}
      onClick={(event) => {
        event.stopPropagation();
        onToggle(user);
      }}
    >
      {busy ? "Saving..." : suspended ? "Reactivate" : "Suspend"}
    </button>
  );
}

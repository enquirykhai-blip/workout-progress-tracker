import { useSyncStatus } from "../utils/syncStatus";

const LABEL = {
  synced: "All changes synced",
  saving: "Saving…",
  loading: "Loading your data…",
  offline: "Offline — will sync when back online",
  error: "Sync problem",
};

// Settings footer: is this device in sync, and which version is it running?
export default function SyncInfo() {
  const status = useSyncStatus();
  return (
    <div className="sync-info">
      <div className={`sync-state ${status.state}`}>
        <span className="sync-dot" />
        {LABEL[status.state]}
        {status.state === "error" && status.detail ? ` (${status.detail})` : ""}
      </div>
      <div className="sync-version">Version {typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "dev"}</div>
    </div>
  );
}

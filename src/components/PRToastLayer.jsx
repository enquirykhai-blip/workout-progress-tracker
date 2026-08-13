import { IconTrophy } from "./icons";

export default function PRToastLayer({ toasts }) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-layer">
      {toasts.map((t) => (
        <div className="pr-toast" key={t.id}>
          <IconTrophy width={16} height={16} />
          {t.message}
        </div>
      ))}
    </div>
  );
}

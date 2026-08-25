import { IconToday, IconChart, IconCalendar, IconScale, IconFlame } from "./icons";

const TABS = [
  { key: "today", label: "Today", Icon: IconToday },
  { key: "progress", label: "Progress", Icon: IconChart },
  { key: "week", label: "Week", Icon: IconCalendar },
  { key: "nutrition", label: "Food", Icon: IconFlame },
  { key: "bodyweight", label: "Body", Icon: IconScale },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(({ key, label, Icon }) => (
        <button
          key={key}
          className={`nav-item${active === key ? " active" : ""}`}
          onClick={() => onChange(key)}
        >
          <Icon />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

// Floating tab bar. A single dark pill slides (with a little spring) to the
// active tab; the active tab swaps its outline icon for a filled one with a
// pop and reveals its label inline.

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

function DumbbellIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {filled ? (
        <g fill="currentColor">
          <rect x="2.5" y="8.5" width="3" height="7" rx="1.2" />
          <rect x="5.5" y="6" width="3.2" height="12" rx="1.4" />
          <rect x="15.3" y="6" width="3.2" height="12" rx="1.4" />
          <rect x="18.5" y="8.5" width="3" height="7" rx="1.2" />
          <rect x="8.5" y="10.9" width="7" height="2.2" rx="1.1" />
        </g>
      ) : (
        <g {...stroke}>
          <rect x="3" y="9" width="2.4" height="6" rx="1" />
          <rect x="5.4" y="6.5" width="3" height="11" rx="1.2" />
          <rect x="15.6" y="6.5" width="3" height="11" rx="1.2" />
          <rect x="18.6" y="9" width="2.4" height="6" rx="1" />
          <path d="M8.4 12h7.2" />
        </g>
      )}
    </svg>
  );
}

function CalendarIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {filled ? (
        <>
          <path
            fill="currentColor"
            d="M7 2.75a.9.9 0 0 1 .9.9V5h8.2V3.65a.9.9 0 1 1 1.8 0V5h.6A2.5 2.5 0 0 1 21 7.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 18.5v-11A2.5 2.5 0 0 1 5.5 5h.6V3.65a.9.9 0 0 1 .9-.9Z"
          />
          <g fill="var(--nav-fill-contrast)">
            <rect x="3" y="9" width="18" height="1.4" />
            <circle cx="8" cy="13.5" r="1.15" />
            <circle cx="12" cy="13.5" r="1.15" />
            <circle cx="16" cy="13.5" r="1.15" />
            <circle cx="8" cy="17.2" r="1.15" />
            <circle cx="12" cy="17.2" r="1.15" />
          </g>
        </>
      ) : (
        <g {...stroke}>
          <rect x="3.6" y="5.2" width="16.8" height="15.2" rx="2.4" />
          <path d="M3.6 9.8h16.8M8 3.4v3.4M16 3.4v3.4" />
          <path d="M8 13.6h.01M12 13.6h.01M16 13.6h.01M8 17.2h.01M12 17.2h.01" strokeWidth="2.4" />
        </g>
      )}
    </svg>
  );
}

function BowlIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      {filled ? (
        <>
          <path
            fill="currentColor"
            d="M3.2 11.2h17.6a.8.8 0 0 1 .8.86A9.6 9.6 0 0 1 15.4 20v.4a.9.9 0 0 1-.9.9h-5a.9.9 0 0 1-.9-.9V20a9.6 9.6 0 0 1-6.2-7.94.8.8 0 0 1 .8-.86Z"
          />
          <path {...stroke} d="M9 8.2c0-1.3 1.2-1.5 1.2-2.8M13.4 8.2c0-1.3 1.2-1.5 1.2-2.8" />
        </>
      ) : (
        <g {...stroke}>
          <path d="M3.2 11.8h17.6A8.8 8.8 0 0 1 15 19.6v1H9v-1a8.8 8.8 0 0 1-5.8-7.8Z" />
          <path d="M9 8.2c0-1.3 1.2-1.5 1.2-2.8M13.4 8.2c0-1.3 1.2-1.5 1.2-2.8" />
        </g>
      )}
    </svg>
  );
}

const TABS = [
  { key: "today", label: "Today", Icon: DumbbellIcon },
  { key: "week", label: "Week", Icon: CalendarIcon },
  { key: "nutrition", label: "Food", Icon: BowlIcon },
];

export default function BottomNav({ active, onChange }) {
  const index = Math.max(
    0,
    TABS.findIndex((t) => t.key === active)
  );

  return (
    <nav className="bottom-nav" style={{ "--i": index }} aria-label="Main">
      <span className="nav-indicator" aria-hidden="true" />
      {TABS.map(({ key, label, Icon }) => {
        const isActive = active === key;
        return (
          <button
            key={key}
            className={`nav-item${isActive ? " active" : ""}`}
            onClick={() => onChange(key)}
            aria-current={isActive ? "page" : undefined}
            aria-label={label}
          >
            <span className="nav-icon" key={isActive ? "on" : "off"}>
              <Icon filled={isActive} />
            </span>
            <span className="nav-label">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};

export function IconToday(props) {
  return (
    <svg {...common} {...props}>
      <path d="M6.5 7V4.5M17.5 7V4.5M4 9.5h16M5 4.5h14a1 1 0 0 1 1 1V19a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5.5a1 1 0 0 1 1-1Z" />
      <path d="m9 13.5 2 2 4-4.5" />
    </svg>
  );
}

export function IconChart(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M12.5 16V8M17 16v-7" />
    </svg>
  );
}

export function IconCalendar(props) {
  return (
    <svg {...common} {...props}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v3M16 3v3" />
    </svg>
  );
}

export function IconScale(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8.2c-1.7 1.5-2.6 3-2.6 3.9a2.6 2.6 0 0 0 5.2 0c0-.9-.9-2.4-2.6-3.9Z" />
    </svg>
  );
}

export function IconCheck(props) {
  return (
    <svg {...common} {...props}>
      <path d="m5 13 4.5 4.5L19 7.5" />
    </svg>
  );
}

export function IconPlus(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function IconChevronLeft(props) {
  return (
    <svg {...common} {...props}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

export function IconChevronRight(props) {
  return (
    <svg {...common} {...props}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

export function IconSearch(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </svg>
  );
}

export function IconClose(props) {
  return (
    <svg {...common} {...props}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

export function IconTrophy(props) {
  return (
    <svg {...common} {...props}>
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 5H5a3 3 0 0 0 3 5M16 5h3a3 3 0 0 1-3 5M10 15v2h4v-2M9 20h6" />
    </svg>
  );
}

export function IconFlame(props) {
  return (
    <svg {...common} {...props}>
      <path d="M12 3c.6 2.1-.4 3.3-1.6 4.6C9.2 8.9 8 10.4 8 12.5a4 4 0 0 0 8 0c0-1.2-.5-2-1-2.7.1 1-.3 1.7-1 1.7-.8 0-1.3-.7-1.2-1.6.2-1.6 1.2-2.6 1.2-4.4C14 4.3 13.2 3.5 12 3Z" />
      <path d="M9.5 15.5a2.5 2.5 0 0 0 5 0" />
    </svg>
  );
}

export function IconCamera(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h1.6l.9-1.5a1 1 0 0 1 .86-.5h6.28a1 1 0 0 1 .86.5l.9 1.5h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

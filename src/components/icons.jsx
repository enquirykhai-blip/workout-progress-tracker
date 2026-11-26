const common = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 24 24",
};



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


export function IconCamera(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 8.5a1.5 1.5 0 0 1 1.5-1.5h1.6l.9-1.5a1 1 0 0 1 .86-.5h6.28a1 1 0 0 1 .86.5l.9 1.5h1.6A1.5 1.5 0 0 1 20 8.5v9A1.5 1.5 0 0 1 18.5 19h-13A1.5 1.5 0 0 1 4 17.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

export function IconSettings(props) {
  return (
    <svg {...common} {...props}>
      <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="17" r="2" />
    </svg>
  );
}

export function IconArrowRight(props) {
  return (
    <svg {...common} {...props}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function IconSwap(props) {
  return (
    <svg {...common} {...props}>
      <path d="M7 4 4 7l3 3M4 7h13M17 20l3-3-3-3M20 17H7" />
    </svg>
  );
}

export function IconTimer(props) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="13" r="8" />
      <path d="M12 9v4l2.5 1.5M9.5 2.5h5" />
    </svg>
  );
}

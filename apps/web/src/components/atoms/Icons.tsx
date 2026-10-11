const common = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  "aria-hidden": true,
} as const;

export function LockIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} {...common}>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

export function EyeIcon() {
  return (
    <svg width="18" height="18" {...common}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function CopyIcon() {
  return (
    <svg width="17" height="17" {...common}>
      <rect x="9" y="9" width="12" height="12" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </svg>
  );
}

export function PencilIcon() {
  return (
    <svg width="17" height="17" {...common}>
      <path d="M4 20h4L19 9l-4-4L4 16z" />
    </svg>
  );
}

export function TrashIcon() {
  return (
    <svg width="17" height="17" {...common}>
      <path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14" />
    </svg>
  );
}

export function KeyIcon() {
  return (
    <svg width="20" height="20" {...common}>
      <circle cx="8" cy="15" r="5" />
      <path d="M11.5 11.5L21 2M17 6l3 3M14 9l2 2" />
    </svg>
  );
}

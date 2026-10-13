// Custom SVG icon set — "Liquid Glass" style, no emoji.

interface IconProps {
  className?: string;
}

/** Android Robot logo (used for favicon & header) */
export function AndroidRobotLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      {/* Antennae */}
      <path
        d="M8.4 5.2a.55.55 0 0 1-.26-.73l-1-1.72a.55.55 0 1 0-.95.55l1 1.72a.55.55 0 0 0 .73.26l.48-.08Z"
        opacity=".9"
      />
      <path
        d="M15.6 5.2a.55.55 0 0 0 .26-.73l1-1.72a.55.55 0 1 1 .95.55l-1 1.72a.55.55 0 0 1-.73.26L15.6 5.2Z"
        opacity=".9"
      />
      {/* Head */}
      <path d="M7.2 9.4a.95.95 0 1 1 0-1.9.95.95 0 0 1 0 1.9Zm9.6 0a.95.95 0 1 1 0-1.9.95.95 0 0 1 0 1.9Z" />
      <path d="M12 3.6c-3.3 0-6 2.5-6.3 5.7h12.6C18 6.1 15.3 3.6 12 3.6Z" />
      {/* Body */}
      <rect x="5.7" y="10.1" width="12.6" height="8.6" rx="2.4" />
      {/* Arms */}
      <rect x="2.6" y="10.1" width="2.1" height="6.6" rx="1.05" />
      <rect x="19.3" y="10.1" width="2.1" height="6.6" rx="1.05" />
      {/* Legs */}
      <rect x="8.2" y="19.4" width="2.1" height="3.4" rx="1.05" />
      <rect x="13.7" y="19.4" width="2.1" height="3.4" rx="1.05" />
    </svg>
  );
}

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export const UploadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 16V4m0 0 4 4m-4-4L8 8" />
    <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const PencilIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5Z" />
  </Svg>
);

export const FlaskIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 3h6" />
    <path d="M10 3v6L4.5 18.5A2 2 0 0 0 6.2 21.5h11.6a2 2 0 0 0 1.7-3L14 9V3" />
    <path d="M7 15h10" />
  </Svg>
);

export const PlayIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M6 4.5 19 12 6 19.5v-15Z" fill="currentColor" stroke="none" />
  </Svg>
);

export const HuaweiIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3c-2.5 2.8-4 6-4 9s1.5 6.2 4 9c2.5-2.8 4-6 4-9s-1.5-6.2-4-9Z" />
    <path d="M3.5 12c2.8-2.5 6-4 9-4s6.2 1.5 9 4c-2.8 2.5-6 4-9 4s-6.2-1.5-9-4Z" opacity=".55" />
  </Svg>
);

export const ShuffleIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M16 3h5v5" />
    <path d="M4 20 21 3" />
    <path d="M21 16v5h-5" />
    <path d="M15 15l6 6" />
    <path d="M4 4l5 5" />
  </Svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

export const RefreshIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M21 12a9 9 0 1 1-2.6-6.3" />
    <path d="M21 3v6h-6" />
  </Svg>
);

export const DownloadIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 4v12m0 0 4-4m-4 4-4-4" />
    <path d="M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </Svg>
);

export const ExternalLinkIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 4h6v6" />
    <path d="M20 4 10.5 13.5" />
    <path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" />
  </Svg>
);

export const CheckIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.5 2.5 2.5 4.5-5.5" />
  </Svg>
);

export const AlertIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 3 2.5 20h19L12 3Z" />
    <path d="M12 10v4" />
    <path d="M12 17.5h.01" />
  </Svg>
);

export const XIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
);

export const InfoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5" />
    <path d="M12 8h.01" />
  </Svg>
);

export const PackageIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M21 8.5 12 4 3 8.5v7L12 20l9-4.5v-7Z" />
    <path d="M3 8.5 12 13l9-4.5" />
    <path d="M12 13v7" />
  </Svg>
);

export const GearIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8" />
  </Svg>
);

export const ChartIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />
  </Svg>
);

export const BugIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="13" r="5" />
    <path d="M12 8V6M9 5l1.5 2M15 5l-1.5 2" />
    <path d="M7 11H3M7 15H3.5M17 11h4M17 15h3.5M10 20l-1.5 2M14 20l1.5 2" />
  </Svg>
);

export const SpinnerIcon = ({ className }: IconProps) => (
  <Svg className={`animate-spin ${className ?? ''}`}>
    <path d="M12 3a9 9 0 1 0 9 9" />
  </Svg>
);

export const FileIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-5Z" />
    <path d="M14 3v5h6" />
  </Svg>
);
